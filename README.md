# Parroquia del Carmen — sitio web 3D

## Ejecutar
1. Descomprimí la carpeta.
2. Abrila con Visual Studio Code.
3. Abrí `index.html` con la extensión **Live Server**.
4. Mantené conexión a internet para cargar Three.js y las fuentes.

El modelo ya está incluido en `public/modelo-parroquia.glb`.
No hace falta volver a exportarlo desde Blender.

## Si el modelo no aparece
- Comprobá que la URL de Live Server sea similar a `http://127.0.0.1:5500/`.
- Abrí las herramientas del navegador con F12 y revisá la pestaña Console.
- No abras `index.html` con doble clic: usá Live Server.

## Incluye
- Modelo 3D de la parroquia.
- Cámara que se acerca al desplazarse por la página.
- Diseño responsive y cuatro paneles de santos.


## Controles del modelo 3D
- Escritorio: arrastrá con el botón izquierdo para girar y usá la rueda para acercar/alejar.
- Celular: arrastrá horizontalmente sobre el modelo para girar; el gesto vertical continúa desplazando la página.
- La cámara se acerca automáticamente al llegar a «Una historia que nos reúne» y se coloca frente a la fachada.
- Después de explorar manualmente, el próximo desplazamiento de la página retoma la cámara narrativa.
