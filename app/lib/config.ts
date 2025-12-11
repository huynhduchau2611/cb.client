// Client-side configuration
export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'CareerBridge',
    description: 'Nền tảng tuyển dụng thân thiện, kết nối người tìm việc với nhà tuyển dụng',
  },
} as const;
