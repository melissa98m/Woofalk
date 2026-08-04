# syntax=docker/dockerfile:1.7

########################################
# deps: install node_modules once, cached and shared by dev/build stages
########################################
FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

########################################
# dev: Vite dev server with hot reload; source is bind-mounted by compose
########################################
FROM deps AS dev
COPY . .
EXPOSE 3000
CMD ["npm", "start"]

########################################
# build: production static bundle
########################################
FROM deps AS build
COPY . .
RUN npm run build

########################################
# prod: nginx serving the optimized static build
########################################
FROM nginx:1.27-alpine@sha256:65645c7bb6a0661892a8b03b89d0743208a18dd2f3f17a54ef4b76fb8e2f2a10 AS prod
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

