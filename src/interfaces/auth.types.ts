export interface AuthPayload {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    phoneNumber: string;
  };
  token: string;
}
