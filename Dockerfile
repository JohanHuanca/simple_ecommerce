# Etapa 1: Instalación de dependencias
FROM node:20-alpine as dev-deps
WORKDIR /app
COPY package.json ./
RUN npm install

# Etapa 2: Construcción de la aplicación React
FROM node:20-alpine as builder
WORKDIR /app
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .
# Asegúrate de que tu package.json tenga un script "build"
RUN npm run build

# Etapa 3: Preparación del entorno de producción con Nginx
FROM nginx:alpine as prod
EXPOSE 80

# CAMBIO CLAVE: Ajusta esta línea a la carpeta de salida de tu build.
# Para Vite es "dist", para Create React App es "build".
COPY --from=builder /app/dist /usr/share/nginx/html

# El resto es igual a tu configuración de Angular
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]