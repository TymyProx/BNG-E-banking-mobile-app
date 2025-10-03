export const API_CONFIG = {
  BASE_URL: "http://192.168.1.200:8080/api",
  TENANT_ID: "aa1287f6-06af-45b7-a905-8c57363565c2",
}

export const API_ENDPOINTS = {
  AUTH: {
    SIGN_IN: "/auth/sign-in",
    ME: "/auth/me",
  },
  BENEFICIARY: {
    CREATE: (tenantId: string) => `/tenant/${tenantId}/beneficiaire`,
    LIST: (tenantId: string) => `/tenant/${tenantId}/beneficiaire`,
    DETAILS: (tenantId: string, beneficiaryId: string) => `/tenant/${tenantId}/beneficiaire/${beneficiaryId}`,
    UPDATE: (tenantId: string, beneficiaryId: string) => `/tenant/${tenantId}/beneficiaire/${beneficiaryId}`,
    DELETE: (tenantId: string, beneficiaryId: string) => `/tenant/${tenantId}/beneficiaire/${beneficiaryId}`,
  },
  ACCOUNT: {
    CREATE: (tenantId: string) => `/tenant/${tenantId}/compte`,
    LIST: (tenantId: string) => `/tenant/${tenantId}/compte`,
    DETAILS: (tenantId: string, accountId: string) => `/tenant/${tenantId}/compte/${accountId}`,
    UPDATE: (tenantId: string, accountId: string) => `/tenant/${tenantId}/compte/${accountId}`,
    DELETE: (tenantId: string, accountId: string) => `/tenant/${tenantId}/compte/${accountId}`,
  },
}
