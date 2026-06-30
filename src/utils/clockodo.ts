import { Clockodo, type Config } from "clockodo";

/**
 * The Clockodo SDK (v25) still targets several endpoint versions that have since
 * been decommissioned by the API and now respond with HTTP 410 Gone:
 *
 *   - `getCustomers` / `getCustomer` -> `/v2/customers`  (gone -> `/v3/customers`)
 *   - `getServices`                  -> `/v3/services`   (gone -> `/v4/services`)
 *   - `getUsers`                     -> `/v2/users`      (gone -> `/v3/users`)
 *   - `addAbsence`                   -> `/v2/absences`   (gone -> `/v4/absences`)
 *
 * Rather than touch every call site, we wrap the SDK in a Proxy that overrides
 * just these methods, routing them to the current endpoints via `clockodo.api`
 * (which transparently maps our camelCase params/responses to and from the API's
 * snake_case). The overrides reshape the new `{ paging, data }` envelope back to
 * the legacy `{ customers }` / `{ services }` / `{ users }` / `{ customer }`
 * shapes the rest of the CLI expects, so consumers stay unchanged.
 *
 * Endpoints that are still alive (`/v2/clock`, `/v2/entries`, `/v2/favorites`,
 * `/v4/projects`) keep using the SDK / direct `clockodo.api` calls as before.
 */

// The largest page size accepted by *every* endpoint we touch here (v3/users
// caps at 1000, while v3/customers and v4/services allow more). Big enough to
// fetch everything in one request for typical accounts; the pagination loop
// covers the rest.
const ITEMS_PER_PAGE = 1000;

type Paging = {
  itemsPerPage: number;
  currentPage: number;
  countPages: number;
  countItems: number;
};

type PagedResponse<T> = { paging: Paging; data: T[] };
type SingleResponse<T> = { data: T };

/**
 * Fetches every item across all pages of a paginated v3/v4 endpoint, matching
 * the "give me everything" behaviour the SDK's list helpers used to provide.
 */
const fetchAllPages = async <T>(
  clockodo: Clockodo,
  url: string,
  filters: Record<string, unknown> = {}
): Promise<T[]> => {
  const items: T[] = [];
  let page = 1;
  let countPages = 1;

  do {
    const { data, paging } = await clockodo.api.get<PagedResponse<T>>(url, {
      ...filters,
      page,
      itemsPerPage: ITEMS_PER_PAGE,
    });

    items.push(...data);
    countPages = paging.countPages;
    page += 1;
  } while (page <= countPages);

  return items;
};

const createOverrides = (clockodo: Clockodo) => ({
  async getCustomers(params: Record<string, unknown> = {}) {
    const customers = await fetchAllPages(clockodo, "v3/customers", params);
    return { customers };
  },

  async getCustomer({ id }: { id: number }) {
    const { data } = await clockodo.api.get<SingleResponse<unknown>>(
      `v3/customers/${id}`
    );
    return { customer: data };
  },

  async getServices(params: Record<string, unknown> = {}) {
    const services = await fetchAllPages(clockodo, "v4/services", params);
    return { services };
  },

  async getUsers(params: Record<string, unknown> = {}) {
    const users = await fetchAllPages(clockodo, "v3/users", params);
    return { users };
  },

  async addAbsence(params: Record<string, unknown> = {}) {
    // The v4 endpoint expects proper booleans / numbers, whereas the legacy
    // call sites still pass 0/1 and string hour counts. Normalise here so the
    // callers can stay untouched.
    const body: Record<string, unknown> = { ...params };

    if ("halfDay" in body && body.halfDay != null) {
      body.halfDay = Boolean(Number(body.halfDay));
    }
    if ("sickNote" in body && body.sickNote != null) {
      body.sickNote = Boolean(Number(body.sickNote));
    }
    if ("countHours" in body && body.countHours != null) {
      body.countHours = Number(body.countHours);
    }

    const { data } = await clockodo.api.post<SingleResponse<unknown>>(
      "v4/absences",
      body
    );
    return { absence: data };
  },
});

/**
 * Creates a Clockodo client whose decommissioned endpoints are transparently
 * routed to their current replacements. Behaves like a normal `Clockodo`
 * instance for every other method and for direct `clockodo.api` access.
 */
export const createClockodo = (config: Config): Clockodo => {
  const clockodo = new Clockodo(config);
  const overrides = createOverrides(clockodo) as Record<string, unknown>;

  return new Proxy(clockodo, {
    get(target, prop, receiver) {
      if (typeof prop === "string" && prop in overrides) {
        return overrides[prop];
      }

      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
};
