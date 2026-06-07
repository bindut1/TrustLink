FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS dev
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM deps AS build
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_CONTRACT_ADDRESS
ARG NEXT_PUBLIC_POLYGON_CHAIN_ID=80002
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_CONTRACT_ADDRESS=$NEXT_PUBLIC_CONTRACT_ADDRESS
ENV NEXT_PUBLIC_POLYGON_CHAIN_ID=$NEXT_PUBLIC_POLYGON_CHAIN_ID
COPY . .
RUN npm run build

FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./
EXPOSE 3000
CMD ["npm", "start"]
