# Laberinto Publicador

Aplicación web para analizar, revisar y programar contenido de las marcas Adrià.

## Flujo principal

1. Subir una foto o un carrusel de hasta 10 imágenes.
2. Analizar el contenido con IA y revisar el texto generado.
3. Elegir una fecha futura y confirmar la programación.
4. Supervisar publicaciones pendientes y errores en la cola real.

El Planificador es exclusivamente un calendario comercial basado en el método ECM. Sus oportunidades preparan un borrador en el Publicador y nunca publican automáticamente.

## Verificación

```sh
npm test
```

La integración de Google Business Profile comprueba la autorización y los perfiles disponibles. La publicación directa en Google requiere validación adicional del servicio del servidor.
