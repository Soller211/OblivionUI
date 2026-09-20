import { test } from 'node:test'
import assert from 'node:assert/strict'
import { specInicial, interpretar, render } from './demo.js'

const base = specInicial('Presupuestos', { datos: 'concepto, monto y fecha', solicita: 'Ana', aprueba: 'Luis' })

test('las respuestas de negocio se vuelven campos', () => {
  assert.deepEqual(base.campos, ['concepto', 'monto', 'fecha'])
})

test('la idea inicial se refleja en la demostración', () => {
  const spec = specInicial('Mi almacén', { datos: 'producto, cantidad' }, 'Controlar el inventario del almacén')
  const html = render(spec)
  assert.equal(spec.tipo, 'inventario')
  assert.match(html, /Nuevo artículo/)
  assert.match(html, /Controlar el inventario del almacén/)
  assert.match(html, /Vista ilustrativa/)
})

test('cambia el color', () => {
  assert.equal(interpretar('ponlo en verde por favor', base).spec.accent, '#16a34a')
})

test('agrega y quita campos', () => {
  const con = interpretar('agrega el campo justificación', base).spec
  assert.ok(con.campos.includes('Justificación'))
  assert.ok(!interpretar('quita el campo monto', con).spec.campos.includes('monto'))
})

test('cambia el título', () => {
  assert.equal(interpretar('cambia el título a "Gastos de viaje"', base).spec.titulo, 'Gastos de viaje')
})

test('lo que no entiende queda anotado, no inventado', () => {
  const r = interpretar('quiero que mande correos a contabilidad', base)
  assert.deepEqual(r.spec.notas, ['quiero que mande correos a contabilidad'])
  assert.match(r.resumen, /demostración/)
})

test('la vista previa escapa el contenido del usuario', () => {
  const html = render({ ...base, titulo: '<img src=x onerror=alert(1)>', notas: [] })
  assert.ok(!html.includes('<img src=x'))
  assert.ok(html.includes('&lt;img'))
})
