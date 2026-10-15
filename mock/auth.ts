export interface DemoLoginCredentials {
  email: string;
  code: string[];
}

export const MOCK_DEMO_LOGIN_CREDENTIALS: DemoLoginCredentials = {
  email: "merchant@crossborder-shop.com",
  code: ["8", "9", "2", "1", "0", "4"],
};
