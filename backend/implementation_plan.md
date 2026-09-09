# Goal Description
The goal is to allow users to manually specify the "Número de Cuotas" (number of periods) and the "Interés %" when creating a new credit, replacing the current hardcoded values (16 weeks, 20% interest, etc). Additionally, the form should display a preview of the payment schedule ("Listado de Cuotas") before the user creates the credit.

## User Review Required
- The current implementation automatically calculates `numero_periodos` based on `periodicidad` (e.g. SEMANAL = 16, MENSUAL = 4). With this change, we will allow the user to input the `numero_periodos` manually. Should we still provide a default based on `periodicidad`, or leave it blank for the user to fill?
- The current implementation hardcodes a 20% interest flat rate (`montoOtorgadoFinal * 1.20`). The new field will allow any percentage. The calculation will be `totalAPagar = montoOtorgadoFinal * (1 + (interes / 100))`. 

## Proposed Changes

### Frontend - CreditForm.jsx

#### [MODIFY] frontend/src/components/CreditForm.jsx
- Add `numero_periodos` and `interes` to the `formData` state.
- Set defaults for `interes` (e.g., 20) and dynamically set `numero_periodos` defaults when `periodicidad` changes to maintain backwards compatibility, but allow the user to override them.
- Add inputs for "Nro Cuotas" and "Interés (%)" in the form layout.
- Add a "Calcular" button (or auto-calculate) to render the preview table.
- Implement a `generarListadoCuotas()` function that calculates the dates and amounts for each installment using the existing `calcularFechaProgramada` logic from `penalties.js` (or inline date math) and displays them in a table.
- Remove the hardcoded `1.20` multiplier and use `(1 + (formData.interes / 100))`.
- Update the `handleSubmit` logic to use the user-provided `numero_periodos` and `interes` when inserting the credit into the database.

## Verification Plan
1. Open the "Nuevo Crédito" modal.
2. Select a client, enter amount, change interest to 15%, and change periods to 10.
3. Verify that the table renders 10 installments with the correct dates and amounts.
4. Submit the form and verify that the database correctly records the credit with `numero_periodos = 10` and the corresponding `total_a_pagar`.
