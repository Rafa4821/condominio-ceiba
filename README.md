# Condominio Ceiba - Sistema de Gestión de Gastos Comunes

Este es un sistema web desarrollado con Next.js y Firebase para la administración de gastos comunes en condominios. Permite gestionar conceptos, unidades, generar liquidaciones, emitir recibos en PDF y enviarlos por correo electrónico.

## Tecnologías Utilizadas

- **Framework**: [Next.js](https://nextjs.org/) con App Router
- **Lenguaje**: TypeScript
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/) y [Bootstrap](https://getbootstrap.com/)
- **Base de Datos**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **Autenticación**: [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Almacenamiento**: [Firebase Storage](https://firebase.google.com/docs/storage) (para logos)
- **Generación de PDF**: [pdfmake](https://pdfmake.github.io/docs/0.1/)
- **Envío de Correos**: [Resend](https://resend.com/)
- **Gestión de Estado de Servidor**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Testing**: [Vitest](https://vitest.dev/)

---

## Guía de Inicio Rápido

### 1. Prerrequisitos

- Node.js (v20 o superior)
- npm o yarn
- Un proyecto de Firebase configurado.

### 2. Instalación

Clona el repositorio e instala las dependencias:

```bash
git clone <url-del-repositorio>
cd condominio-ceiba
npm install
```

### 3. Configuración de Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto y añade las credenciales de tu proyecto de Firebase y la API key de Resend.

```plaintext
# Firebase (obtenidas desde la configuración de tu proyecto en la consola de Firebase)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=1:...

# Resend (obtenida desde tu cuenta de Resend)
RESEND_API_KEY=re_...
```

### 4. Configuración de la Cuenta de Servicio (para Seeding)

Para poblar la base de datos con datos de prueba, necesitas una clave de cuenta de servicio de Firebase:

1.  En la Consola de Firebase, ve a **Configuración del proyecto > Cuentas de servicio**.
2.  Haz clic en **Generar nueva clave privada** y descarga el archivo JSON.
3.  Crea un directorio `scripts/` en la raíz del proyecto.
4.  Mueve el archivo descargado a `scripts/` y renómbralo a `serviceAccountKey.json`.

> **Nota**: Este archivo ya está incluido en el `.gitignore` para evitar que se suba al repositorio.

### 5. Poblar la Base de Datos (Seeding)

Ejecuta el siguiente comando para poblar tu base de datos de Firestore con un edificio, unidades y conceptos de ejemplo:

```bash
npm run db:seed
```

### 6. Desplegar Reglas de Seguridad

Los archivos `firestore.rules` y `storage.rules` contienen las reglas de seguridad para la base de datos y el almacenamiento de archivos, respectivamente. Despliégalas usando Firebase CLI o copiando su contenido en la sección **Reglas** de Firestore y Storage en la consola de Firebase.

### 7. Ejecutar en Desarrollo

Inicia el servidor de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador. Para iniciar sesión, puedes crear un usuario manualmente desde la consola de Firebase Authentication.

---

## Despliegue

El proyecto está listo para ser desplegado en [Vercel](https://vercel.com/).

1.  Importa el repositorio de Git en Vercel.
2.  Configura las mismas variables de entorno que usaste en `.env.local` en la configuración del proyecto de Vercel.
3.  ¡Despliega!
