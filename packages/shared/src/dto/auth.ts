export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    isAdmin?: boolean;
  };
  token: string;
}

export interface SignUpResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  token: string;
}


