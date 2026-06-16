import { ClockodoProp } from "../types/clockodo";

/**
 * The SDK's `getProjects`/`addProject` helpers still target the legacy
 * `/v2/projects` endpoint, which has been decommissioned. We therefore talk to
 * the `/v4/projects` endpoint directly via `clockodo.api`, which transparently
 * maps our camelCase params/responses to and from the API's snake_case.
 */

export type Project = {
  id: number;
  customersId: number;
  name: string;
  number: string | null;
  active: boolean;
  billableDefault: boolean;
  note?: string | null;
  completed: boolean;
  completedAt: string | null;
};

type Paging = {
  itemsPerPage: number;
  currentPage: number;
  countPages: number;
  countItems: number;
};

type ProjectsResponse = {
  paging: Paging;
  data: Project[];
};

type ProjectResponse = {
  data: Project;
};

type GetProjectsFilters = {
  filterCustomersId?: number;
  filterActive?: boolean;
  filterCompleted?: boolean;
  filterFulltext?: string;
};

// The maximum the v4 endpoint allows, so we usually fetch everything in one go.
const ITEMS_PER_PAGE = 5000;

/**
 * Fetches every project across all pages, matching the behaviour the SDK's
 * `getProjects` used to provide.
 */
export const getAllProjects = async ({
  clockodo,
  ...filters
}: ClockodoProp & GetProjectsFilters): Promise<Project[]> => {
  const projects: Project[] = [];
  let page = 1;
  let countPages = 1;

  do {
    const { data, paging } = await clockodo.api.get<ProjectsResponse>(
      "v4/projects",
      { ...filters, page, itemsPerPage: ITEMS_PER_PAGE }
    );

    projects.push(...data);
    countPages = paging.countPages;
    page += 1;
  } while (page <= countPages);

  return projects;
};

export const createProject = async ({
  clockodo,
  name,
  customersId,
}: ClockodoProp & { name: string; customersId: number }): Promise<Project> => {
  const { data } = await clockodo.api.post<ProjectResponse>("v4/projects", {
    name,
    customersId,
  });

  return data;
};
