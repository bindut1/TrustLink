FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS dev
EXPOSE 4000
CMD ["npm", "run", "start:dev"]

FROM deps AS build
COPY . .
RUN npm run build

FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
# Learned matching weights (MatchingWeightsService reads config/match-weights.json);
# falls back to the baseline if absent.
COPY --from=build /app/config ./config
EXPOSE 4000
CMD ["node", "dist/main"]
