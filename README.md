# Tienda Liceo Alexander Dul

Tienda en línea de útiles escolares y uniformes para el **Liceo Alexander Dul**, con un panel para el personal que atiende los pedidos. La usa el colegio con papás reales en el ciclo 2026–2027.

🔗 **En vivo:** https://liceo-alexander-dul.web.app

## El problema

Cada inicio de ciclo, los papás tenían que conseguir por su cuenta la lista de útiles de cada grado, los libros (en secundaria, el libro de inglés depende del nivel de cada alumno) y los uniformes. El colegio llevaba los pedidos, el inventario y los cortes de caja a mano.

## Qué hace

**Para los papás**
- Eligen el grado y reciben la lista oficial ya armada: paquete completo, solo libros, solo material o artículo por artículo.
- Pueden comprar para varios hijos a la vez, aunque sean hermanos o gemelos en el mismo grado.
- En 1° de secundaria, el libro de inglés se elige solo según el nivel del alumno (Básico o Avanzado).
- Uniformes por grupo (primaria niño/niña, secundaria hombre/mujer), con fotos y tallas. Si una talla se agota, pueden pedir "Avísame cuando haya".
- Recogen en el local o piden envío a domicilio. El costo del envío se calcula por zonas según los kilómetros por calle, con un mapa de Google donde el papá marca su casa.
- Pagan en efectivo o por transferencia. Si es transferencia, suben su comprobante y se revisa en el navegador con OCR.
- Reciben un recibo con código QR y pueden seguir su pedido por folio, o por nombre y teléfono si perdieron el folio.

**Para el personal**
- Pedidos en tiempo real, con aviso y sonido cuando entra uno nuevo.
- Escáner QR para abrir el pedido desde el recibo del papá, lista de verificación para armarlo y firma de quien recibe.
- Etapas del pedido: recibido → preparando → listo → entregado. Cuando el pedido está listo o se entrega, al papá le llega un correo automático (si dejó correo), y el personal puede mandarle el aviso por WhatsApp con un botón, con el mensaje ya escrito.
- Plazo de 7 días hábiles para recoger los pedidos que se pagan en efectivo. Los pedidos vencidos se marcan y se pueden cancelar, y las piezas regresan al inventario.
- Inventario por artículo, compartido entre listas. Por ejemplo, "Tijeras punta roma" es un solo conteo aunque venga en varios grados.
- Cortes de caja exportables a Excel, y un tablero de ventas con la "tasa de compra" de cada artículo.
- Editor de listas y uniformes. Las listas se cargan y descargan en el mismo formato de Excel que ya usa el colegio.

## Tecnología

| | |
|---|---|
| Frontend | HTML, CSS y JavaScript sin framework (un solo módulo ES) |
| Backend | Firebase: Firestore, Authentication, Storage y Hosting |
| Mapas | Google Maps JavaScript API, Places y Routes API (con OpenStreetMap / Nominatim como respaldo) |
| Correos | EmailJS |
| Otros | jsQR (escáner), SheetJS y ExcelJS (Excel), Tesseract.js (OCR de comprobantes) |

## Decisiones técnicas

- **Sin paso de compilación.** Toda la tienda vive en `public/index.html`, con las librerías cargadas desde CDN. Se publica con un solo `firebase deploy`, y el colegio no depende de herramientas de compilación para mantenerla.
- **Pedidos atómicos.** Crear un pedido usa una transacción de Firestore (`runTransaction`): guarda el pedido, descuenta el inventario y registra la búsqueda por nombre y teléfono, todo o nada. Así dos papás no pueden comprar la última pieza al mismo tiempo.
- **Reglas de seguridad en Firestore.** Los papás no tienen cuenta: pueden crear pedidos y consultarlos por folio, pero no listarlos. El inventario solo lo pueden *bajar* al comprar. Todo lo demás es exclusivo del personal.
- **Comprobantes de transferencia.** El OCR atrapa errores honestos (monto equivocado, imagen que no es un comprobante), pero no evita fraudes. Por eso hay más controles: el personal confirma el pago antes de avanzar el pedido, hay un enlace al CEP de Banxico con la clave de rastreo, y cada comprobante deja una "huella" que impide usarlo en dos pedidos.
- **Pensada para el celular.** Los campos usan `inputmode` en lugar de `type="email"` o `type="number"` para que el cursor no salte al escribir. El mapa se monta en un nodo persistente para no recargarlo en cada render.
- **WhatsApp primero.** El correo es opcional para no gastar el cupo gratis de EmailJS (200 al mes). El aviso principal al papá es por WhatsApp.

## Estructura

```
public/index.html          la tienda y el panel completos
public/data/               listas de útiles del ciclo 2026–2027
public/img/                logo y fotos de uniformes
firestore.rules            reglas de seguridad de la base de datos
storage.rules              reglas de los archivos (comprobantes y firmas)
seed/                      script para cargar los datos iniciales
listas/                    listas de útiles del colegio en Excel
```

## Correr el proyecto

```bash
firebase serve --only hosting   # vista previa local (usa el proyecto real de Firebase)
firebase deploy --only hosting  # publicar
```

---

Hecho por **Karen Lima**. Publicado con permiso del Liceo Alexander Dul.
