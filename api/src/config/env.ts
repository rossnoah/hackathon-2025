import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  databaseUrl: process.env.DATABASE_URL || 'file:./data/hackathon.db',
  nodeEnv: process.env.NODE_ENV || 'development',
};
