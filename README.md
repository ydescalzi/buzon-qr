# Buzón QR — Sugerencias por área + Fotochecks con QR

Sistema interno para que el personal envíe **sugerencias, ideas, reconocimientos o quejas directamente al área correcta** escaneando un código QR, y para generar **fotochecks imprimibles** con foto, cargo y QR personal.

Hecho con **React + TypeScript (Vite)** y un servidor **Node/Express** muy simple que guarda todo en un archivo JSON (no necesita instalar base de datos).

---

## ¿Cómo funciona?

| Quién | Qué hace | Dónde |
|---|---|---|
| Cualquier colaborador | Escanea el QR pegado en el área (ej. Dpto. de Sistemas), escribe y envía. Puede ser **anónimo**. | `/s/:area` (se abre en el celular) |
| El área (ej. Sistemas) | Entra con su **PIN**, ve solo sus mensajes, los marca como *Leída / En proceso / Atendida / Descartada*, agrega notas internas y exporta a Excel. | `/bandeja` |
| Administrador (RRHH / TI) | Crea áreas y PINs, registra al personal con foto, imprime afiches QR y fotochecks, ve el resumen general. | `/admin` |
| Quien escanee un fotocheck | Ve la foto, nombre, cargo, área y si la credencial está activa, con un botón para enviar sugerencia a esa área. | `/p/:id` |

**Anonimato real:** cuando alguien marca “anónimo”, el servidor no guarda nombre, IP ni datos del dispositivo. (Solo hay un límite anti-spam en memoria que se borra al reiniciar.)

---

## Requisitos

- [Node.js](https://nodejs.org) 18 o superior
- VS Code (recomendado)

## Instalación y uso en desarrollo

```bash
npm install
npm run dev
```

Esto levanta dos cosas a la vez:
- La web en **http://localhost:5173**
- La API en **http://localhost:3001**

Datos iniciales:
- PIN de administrador: **`admin123`**
- Se crean 4 áreas de ejemplo (Sistemas, RRHH, Contabilidad, Logística), todas con PIN **`1234`**. Cámbialos desde *Administración → Áreas y QR*.

## ⚠️ Importante: que los QR funcionen en los celulares

Los celulares tienen que poder abrir la dirección que va dentro del QR. Si el QR dice `localhost`, **solo funcionará en tu propia PC**.

1. Conecta la PC y los celulares a la **misma red** (WiFi/LAN de la oficina).
2. Entra a *Administración → Configuración*.
3. En “URL pública” elige una de las **direcciones de red detectadas** (ej. `http://192.168.1.50:5173`) y guarda.
4. Recién entonces imprime los afiches y fotochecks.

> Si Windows pregunta por el firewall al iniciar, permite el acceso en **redes privadas**.
> Si la IP de tu PC cambia, los QR impresos dejarán de funcionar: pide a soporte una **IP fija** para el equipo servidor, o publícalo en un servidor con dominio.

## Uso en producción (un solo puerto)

```bash
npm run build
npm start
```

Todo (web + API) queda en **http://IP-DEL-SERVIDOR:3001**. Configura esa dirección como “URL pública”.

### Cambiar el PIN de administrador y el puerto

Windows (PowerShell):
```powershell
$env:ADMIN_PIN="MiClaveSegura2026"; $env:PORT="8080"; npm start
```
Linux / macOS:
```bash
ADMIN_PIN=MiClaveSegura2026 PORT=8080 npm start
```

## Impresión

- **Afiches de áreas** (`Áreas y QR → Imprimir afiches QR`): 1 área por hoja A4.
- **Fotochecks** (`Personal y fotochecks → Imprimir`): tamaño tarjeta CR80 (54 × 85.6 mm), 9 por hoja A4, con línea punteada de corte. Puedes imprimir todos, los de un área o solo los seleccionados.
- En el diálogo de impresión: escala **100% / tamaño real**, márgenes **ninguno**, y activa **“Gráficos de fondo”** para que salgan los colores.

## Identidad visual

La aplicación usa el logotipo institucional incluido en `public/usmp-logo.png` cuando no hay un logo personalizado. Puedes cargar otro desde *Administración → Configuración*; el rojo institucional se usa en la interfaz y cada área conserva el color que tenga configurado.

## Respaldo de datos

Todo se guarda en `server/data/db.json` (áreas, personal con fotos, sugerencias). **Copia ese archivo periódicamente** como respaldo. Para empezar desde cero, detén el servidor y borra esa carpeta.

## Estructura del proyecto

```
buzon-qr/
├── server/
│   └── index.ts              API Express + base de datos JSON
├── src/
│   ├── types.ts              Tipos compartidos (servidor y cliente)
│   ├── App.tsx               Rutas
│   ├── styles.css            Estilos + diseño de impresión
│   ├── lib/                  api, hooks, utilidades de imagen
│   ├── components/
│   │   ├── IdCard.tsx        Fotocheck
│   │   ├── AreaPoster.tsx    Afiche A4 con QR
│   │   └── Layout.tsx
│   └── pages/
│       ├── HomePage.tsx      Lista de áreas
│       ├── SuggestPage.tsx   Formulario (lo que abre el QR del área)
│       ├── PersonaPage.tsx   Perfil (lo que abre el QR del fotocheck)
│       ├── InboxPage.tsx     Bandeja de cada área
│       ├── AdminPage.tsx     + admin/ (Resumen, Áreas, Personal, Config)
│       ├── PrintAreasPage.tsx
│       └── PrintCardsPage.tsx
└── vite.config.ts
```

## Ideas para una siguiente versión

- Notificación por correo al área cuando llega una sugerencia nueva.
- Código de seguimiento para que quien envía (aun anónimo) vea si su sugerencia fue atendida.
- Login con usuarios reales (en vez de PIN por área) y base de datos (SQLite/PostgreSQL) si crece el uso.
- Reverso del fotocheck con datos de contacto / grupo sanguíneo.
