/**
 * --- hungaro.js ---
 */

// --- VARIABLES GLOBALES ---
let rows = 3; // Número inicial de filas
let cols = 3; // Número inicial de columnas
const MAX_SIZE = 6; // Límite máximo de tamaño para la matriz, para evitar problemas de rendimiento.
/**
 * @function DOMContentLoaded
 * @description Se ejecuta cuando toda la página HTML ha sido cargada.
 * Configura el estado inicial de la aplicación, crea la tabla y asigna los eventos a los botones.
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Crea la tabla inicial con el tamaño por defecto.
    createTable();
    // 2. Habilita o deshabilita los botones de control según el tamaño de la matriz.
    updateButtonStates();
    // 3. Asigna las funciones correspondientes a cada botón de la interfaz.
    document.getElementById("addRowBtn").addEventListener("click", addRow);
    document.getElementById("addColBtn").addEventListener("click", addCol);
    document.getElementById("removeRowBtn").addEventListener("click", removeRow);
    document.getElementById("removeColBtn").addEventListener("click", removeCol);
    document.getElementById("minBtn").addEventListener("click", () => solveHungarian(false));
    document.getElementById("maxBtn").addEventListener("click", () => solveHungarian(true));
});

/**
 * @function updateButtonStates
 * @description Habilita o deshabilita los botones de añadir/reducir filas y columnas
 * basándose en el tamaño actual de la matriz y el límite `MAX_SIZE`.
 */

function updateButtonStates() {
    document.getElementById("addRowBtn").disabled = rows >= MAX_SIZE;
    document.getElementById("addColBtn").disabled = cols >= MAX_SIZE;
    document.getElementById("removeRowBtn").disabled = rows <= 1;
    document.getElementById("removeColBtn").disabled = cols <= 1;
}

/**
 * @function createTable
 * @description Dibuja o redibuja la tabla de la matriz de costos en el HTML.
 * Crea los encabezados de filas y columnas y las celdas para introducir los valores.
 */

function createTable() {
    const table = document.getElementById("costMatrix");
    table.innerHTML = ""; // Limpia la tabla existente antes de volver a dibujarla.

    // Crear encabezado de la tabla (para los nombres de las columnas)
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    headerRow.insertCell().innerHTML = ""; // Celda vacía en la esquina superior izquierda.
    for (let j = 0; j < cols; j++) {
        const th = document.createElement("th");
        th.innerHTML = `<input type="text" placeholder="Columna ${j + 1}" />`;
        headerRow.appendChild(th);
    }

    // Crear cuerpo de la tabla (para los nombres de las filas y los costos)
    const tbody = table.createTBody();
    for (let i = 0; i < rows; i++) {
        const tr = tbody.insertRow();
        // Celda para el nombre de la fila
        const th = document.createElement("th");
        th.innerHTML = `<input type="text" placeholder="Fila ${i + 1}" />`;
        tr.appendChild(th);
        // Celdas para los costos
        for (let j = 0; j < cols; j++) {
            const td = tr.insertCell();
            // Se añade min="0" para que el input no acepte números negativos.
            td.innerHTML = `<input type="number" placeholder="0" min="0" />`;
        }
    }
}

// --- FUNCIONES DE CONTROL DE LA MATRIZ ---

/** @function addRow - Añade una fila a la matriz. */
function addRow() {
    if (rows < MAX_SIZE) {
        rows++;
        createTable(); // Redibuja la tabla
        updateButtonStates(); // Actualiza los botones
    }
}

/** @function addCol - Añade una columna a la matriz. */
function addCol() {
    if (cols < MAX_SIZE) {
        cols++;
        createTable();
        updateButtonStates();
    }
}

/** @function removeRow - Elimina la última fila de la matriz. */
function removeRow() {
    if (rows > 1) {
        rows--;
        createTable();
        updateButtonStates();
    }
}

/** @function removeCol - Elimina la última columna de la matriz. */
function removeCol() {
    if (cols > 1) {
        cols--;
        createTable();
        updateButtonStates();
    }
}

/**
 * @function getMatrix
 * @description Lee los valores de la tabla HTML y los convierte en una matriz numérica (un array de arrays).
 * @returns {number[][]} La matriz de costos leída de la interfaz.
 */

function getMatrix() {
    const dataRows = document.querySelectorAll("#costMatrix tbody tr");
    return Array.from(dataRows, tr => Array.from(tr.querySelectorAll("td input[type=number]"), input => {
        // Si una celda está vacía, se interpreta como un costo "infinito" o de prohibición.
        if (input.value.trim() === '') {
            return 10000;
        }
        // Convierte el valor a número. La validación `min="0"` ya previene la entrada de negativos.
        const value = parseFloat(input.value);
        return isNaN(value) || value < 0 ? 0 : value;
    }));
}


// --- LÓGICA PRINCIPAL DEL MÉTODO HÚNGARO ---

/**
 * @function solveHungarian
 * @description Es la función principal que orquesta todo el algoritmo Húngaro.
 * @param {boolean} isMaximization - Si es `true`, resuelve un problema de maximización. Si es `false`, de minimización.
 */

function solveHungarian(isMaximization) {
    let detailedSteps = []; // Array para almacenar cada paso del proceso para el visualizador.
    const originalMatrix = getMatrix(); // Obtiene la matriz de costos desde la UI.

    if (originalMatrix.length === 0 || originalMatrix[0].length === 0) {
        alert("ERROR: La matriz de costos está vacía.");
        return;
    }

    // Paso 0: Guardar la matriz inicial.
    let mat = originalMatrix.map(r => [...r]);
    detailedSteps.push({title: "Paso 0: Matriz Inicial", matrix: JSON.parse(JSON.stringify(originalMatrix))});

    // Si es un problema de Maximización, se transforma la matriz.
    if (isMaximization) {
        let maxVal = -Infinity;
        mat.forEach(row => row.forEach(val => { if (val > maxVal) maxVal = val; }));
        mat = mat.map(row => row.map(val => maxVal - val)); // Matriz de arrepentimiento
        detailedSteps.push({
            title: `Transformación para Maximización (Resta de ${maxVal})`,
            matrix: JSON.parse(JSON.stringify(mat))
        });
    }

    const n = Math.max(mat.length, mat[0].length); // Dimensión de la matriz cuadrada.
    let stepOffset = 0; // Ayuda a numerar los pasos correctamente si se añade una fila/columna.

    // Paso 1: Asegurar que la matriz sea cuadrada, añadiendo filas/columnas ficticias (con ceros).
    if (mat.length < n || mat[0].length < n) {
        mat.forEach(row => { while (row.length < n) row.push(0); });
        while (mat.length < n) { mat.push(Array(n).fill(0)); }
        detailedSteps.push({title: "Paso 1: Matriz Cuadrada (con ficticios)", matrix: JSON.parse(JSON.stringify(mat))});
        stepOffset = 1;
    }

    // --- Reducción de Columnas (con pasos didácticos) ---
    const matrixBeforeColReduction = JSON.parse(JSON.stringify(mat));
    const colMins = [];
    const minColPositions = []; // Almacena las coordenadas de los mínimos para resaltarlos.
    for (let j = 0; j < n; j++) {
        const col = mat.map(row => row[j]);
        const min = Math.min(...col);
        colMins.push(min);
        if (min > 0) { minColPositions.push({ r: col.indexOf(min), c: j }); }
    }
    // Paso didáctico: Mostrar los mínimos encontrados en las columnas.
    detailedSteps.push({
        title: `Paso ${1 + stepOffset}: Encontrar Mínimo de Columnas`,
        matrix: matrixBeforeColReduction,
        highlights: minColPositions // Pasa las coordenadas para resaltar.
    });
    // Realizar la resta.
    for (let j = 0; j < n; j++) {
        if (colMins[j] > 0) { for (let i = 0; i < n; i++) mat[i][j] -= colMins[j]; }
    }
    // Mostrar la matriz después de la reducción.
    detailedSteps.push({
        title: `Paso ${2 + stepOffset}: Restar Mínimo de Columnas`,
        matrix: JSON.parse(JSON.stringify(mat))
    });

    // --- Reducción de Filas (con pasos didácticos) ---
    const matrixBeforeRowReduction = JSON.parse(JSON.stringify(mat));
    const rowMins = [];
    const minRowPositions = [];
    mat.forEach((row, i) => {
        const min = Math.min(...row);
        rowMins.push(min);
        if (min > 0) { minRowPositions.push({ r: i, c: row.indexOf(min) }); }
    });
    // Paso didáctico: Mostrar los mínimos encontrados en las filas.
    detailedSteps.push({
        title: `Paso ${3 + stepOffset}: Encontrar Mínimo de Filas`,
        matrix: matrixBeforeRowReduction,
        highlights: minRowPositions
    });
    // Realizar la resta.
    mat.forEach((row, i) => {
        if (rowMins[i] > 0) { row.forEach((_, j) => (row[j] -= rowMins[i])); }
    });
    // Mostrar la matriz después de la reducción.
    detailedSteps.push({
        title: `Paso ${4 + stepOffset}: Restar Mínimo de Filas`,
        matrix: JSON.parse(JSON.stringify(mat))
    });

    // --- Bucle principal del algoritmo: Trazar líneas y ajustar matriz ---
    let stepCounter = 5 + stepOffset;
    while (true) {
        // Intenta encontrar la asignación óptima trazando el mínimo número de líneas para cubrir todos los ceros.
        const {covers, starredZeros} = findMinimumLines(mat);
        const lineCount = covers.row.filter(Boolean).length + covers.col.filter(Boolean).length;

        // Guardar el paso de trazado de líneas.
        detailedSteps.push({
            title: `Paso ${stepCounter}: Trazar líneas (${lineCount}) para cubrir ceros`,
            matrix: JSON.parse(JSON.stringify(mat)),
            lines: JSON.parse(JSON.stringify(covers)) // Pasa la información de las líneas a dibujar.
        });

        // Condición de parada: Si el número de líneas es igual a la dimensión de la matriz, se encontró la solución.
        if (lineCount >= n) {
            let totalValue = 0;
            const rowHeaders = Array.from(document.querySelectorAll("#costMatrix tbody th input"), input => input.value || input.placeholder);
            const colHeaders = Array.from(document.querySelectorAll("#costMatrix thead th input"), input => input.value || input.placeholder);
            const finalAssignment = [];
            for (const row in starredZeros) { finalAssignment.push([+row, starredZeros[row]]); }

            // Construir el texto del resultado final.
            const resultStr = finalAssignment.map(([r, c]) => {
                if (r < originalMatrix.length && c < originalMatrix[0].length) {
                    totalValue += originalMatrix[r][c];
                }
                return `${rowHeaders[r] || `F${r + 1}`} → ${colHeaders[c] || `C${c + 1}`}`;
            }).join("<br>");
            const resultType = isMaximization ? "Ganancia Máxima" : "Costo Mínimo";

            // Prepara la matriz final para la visualización, asegurando que sea cuadrada.
            const finalDisplayMatrix = JSON.parse(JSON.stringify(originalMatrix));
            while(finalDisplayMatrix.length < n) { finalDisplayMatrix.push(new Array(originalMatrix[0]?.length || 0).fill(0)); }
            finalDisplayMatrix.forEach(row => { while(row.length < n) { row.push(0); } });

            // Paso final: Mostrar la solución.
            detailedSteps.push({
                title: `--- Solución Óptima Encontrada ---`,
                matrix: finalDisplayMatrix, // Muestra la matriz cuadrada con costos originales.
                assignment: starredZeros,    // Coordenadas de la asignación para resaltar.
                finalText: `${resultStr}<br><br><b>${resultType}: ${totalValue}</b>`
            });
            break; // Salir del bucle.
        }

        // Si no se encontró la solución, se ajusta la matriz.
        stepCounter++;
        adjustMatrix(mat, covers);
        detailedSteps.push({title: `Paso ${stepCounter}: Ajuste de Matriz`, matrix: JSON.parse(JSON.stringify(mat))});
        stepCounter++;
    }

    // Muestra el modal con todos los pasos recopilados.
    showSolutionModal(detailedSteps);
}

/**
 * @function findMinimumLines
 * @description Implementa el algoritmo de Munkres (o una variación) para encontrar el número mínimo de líneas
 * que cubren todos los ceros de la matriz. También determina las asignaciones (starredZeros).
 * @param {number[][]} mat - La matriz de costos reducida.
 * @returns {{covers: {row: boolean[], col: boolean[]}, starredZeros: {}}}
 */

function findMinimumLines(mat) {
    const n = mat.length;
    const starredZeros = {};
    const coveredRows = Array(n).fill(false);
    const coveredCols = Array(n).fill(false);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (mat[i][j] === 0 && !coveredCols[j]) {
                starredZeros[i] = j;
                coveredCols[j] = true;
                break;
            }
        }
    }
    coveredCols.fill(false);
    for (const row in starredZeros) { coveredCols[starredZeros[row]] = true; }
    if (Object.keys(starredZeros).length >= n) { return {covers: {row: coveredRows, col: coveredCols}, starredZeros}; }
    let primedZeros = {};
    while (true) {
        let uncoveredZero = findUncoveredZero(mat, coveredRows, coveredCols);
        if (!uncoveredZero) break;
        const [r, c] = uncoveredZero;
        primedZeros[r] = c;
        const starColInRow = starredZeros[r];
        if (starColInRow !== undefined) {
            coveredRows[r] = true;
            coveredCols[starColInRow] = false;
        } else {
            let path = [[r, c]];
            let currentRow = r;
            let currentCol = c;
            while (true) {
                const starRow = Object.keys(starredZeros).find((key) => starredZeros[key] === currentCol);
                if (starRow === undefined) break;
                path.push([parseInt(starRow), currentCol]);
                currentRow = parseInt(starRow);
                currentCol = primedZeros[currentRow];
                path.push([currentRow, currentCol]);
            }
            path.forEach(([pr, pc]) => { if (primedZeros[pr] === pc) starredZeros[pr] = pc; });
            coveredRows.fill(false);
            coveredCols.fill(false);
            primedZeros = {};
            for (const row in starredZeros) { coveredCols[starredZeros[row]] = true; }
        }
    }
    return {covers: {row: coveredRows, col: coveredCols}, starredZeros};
}

/**
 * @function findUncoveredZero
 * @description Encuentra el primer cero que no está cubierto por una línea.
 * @returns {number[] | null} Las coordenadas [fila, columna] del cero o `null` si no hay.
 */

function findUncoveredZero(mat, coveredRows, coveredCols) {
    for (let i = 0; i < mat.length; i++) {
        if (!coveredRows[i]) {
            for (let j = 0; j < mat.length; j++) {
                if (!coveredCols[j] && mat[i][j] === 0) return [i, j];
            }
        }
    }
    return null;
}

/**
 * @function adjustMatrix
 * @description Ajusta la matriz cuando no se ha encontrado una solución óptima.
 * 1. Encuentra el valor mínimo no cubierto por ninguna línea.
 * 2. Resta este valor de todos los elementos no cubiertos.
 * 3. Suma este valor a los elementos cubiertos por dos líneas (intersecciones).
 * @param {number[][]} mat - La matriz a ajustar.
 * @param {{row: boolean[], col: boolean[]}} covers - Información sobre qué filas/columnas están cubiertas.
 */

function adjustMatrix(mat, covers) {
    const n = mat.length;
    let minUncovered = Infinity;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (!covers.row[i] && !covers.col[j] && mat[i][j] < minUncovered) {
                minUncovered = mat[i][j];
            }
        }
    }
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (!covers.row[i] && !covers.col[j]) {
                mat[i][j] -= minUncovered; // Restar de los no cubiertos
            } else if (covers.row[i] && covers.col[j]) {
                mat[i][j] += minUncovered; // Sumar en las intersecciones
            }
        }
    }
}

// --- FUNCIONES PARA EL MODAL DE SOLUCIÓN ---

/**
 * @function createSolutionModal
 * @description Crea el HTML del modal de solución y lo añade al `body` si no existe.
 */

function createSolutionModal() {
    if (document.getElementById("solutionModal")) return; // No crear si ya existe.
    const modalHTML = `<div id="solutionModal" class="modal-container"><div class="modal-content"><span class="modal-close-btn">&times;</span><h2 id="modalStepTitle"></h2><div id="modalMatrixContainer"></div><div id="modalFinalResult"></div><div class="modal-navigation"><button id="modalPrevBtn">&laquo; Anterior</button><span id="modalStepCounter"></span><button id="modalNextBtn">Siguiente &raquo;</button></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById("solutionModal");
    modal.querySelector(".modal-close-btn").addEventListener("click", hideSolutionModal);
    modal.addEventListener("click", e => { if (e.target.id === "solutionModal") hideSolutionModal(); });
}

/**
 * @function showSolutionModal
 * @description Muestra el modal y configura la navegación entre los pasos de la solución.
 * @param {object[]} steps - El array de pasos generado por `solveHungarian`.
 */

function showSolutionModal(steps) {
    createSolutionModal();
    const modal = document.getElementById("solutionModal");
    let currentStepIndex = 0;
    const render = () => renderModalStep(steps, currentStepIndex);
    const next = () => { if (currentStepIndex < steps.length - 1) { currentStepIndex++; render(); } };
    const prev = () => { if (currentStepIndex > 0) { currentStepIndex--; render(); } };
    document.getElementById("modalNextBtn").onclick = next;
    document.getElementById("modalPrevBtn").onclick = prev;
    render(); // Muestra el primer paso.
    modal.style.display = "flex";
    document.body.classList.add("modal-active"); // Para difuminar el fondo.
}

/**
 * @function hideSolutionModal
 * @description Oculta el modal de la solución.
 */

function hideSolutionModal() {
    document.getElementById("solutionModal").style.display = "none";
    document.body.classList.remove("modal-active");
}

/**
 * @function renderModalStep
 * @description Dibuja el contenido de un paso específico dentro del modal.
 * @param {object[]} steps - El array completo de pasos.
 * @param {number} index - El índice del paso a mostrar.
 */

function renderModalStep(steps, index) {
    const stepData = steps[index];
    document.getElementById("modalStepTitle").innerHTML = stepData.title;
    const matrixContainer = document.getElementById("modalMatrixContainer");
    const finalResultContainer = document.getElementById("modalFinalResult");

    matrixContainer.innerHTML = "";
    finalResultContainer.innerHTML = "";

    // Dibuja la tabla de la matriz para el paso actual.
    if (stepData.matrix) {
        const table = document.createElement("table");
        table.className = "modal-matrix";
        const tbody = document.createElement("tbody");
        stepData.matrix.forEach((rowData, r_idx) => {
            const tr = tbody.insertRow();
            rowData.forEach((cellData, c_idx) => {
                const td = tr.insertCell();
                td.textContent = cellData;

                // Aplicar resaltados según la información del paso.
                if (stepData.highlights && stepData.highlights.some(pos => pos.r === r_idx && pos.c === c_idx)) {
                    td.classList.add("highlight-min"); // Resaltado amarillo para mínimos.
                }
                if (stepData.assignment && stepData.assignment[r_idx] === c_idx) {
                    td.classList.add("highlight-cell"); // Resaltado verde para la asignación final.
                }
            });
        });
        table.appendChild(tbody);
        matrixContainer.appendChild(table);
    }

    // Muestra el texto de la solución final si existe.
    if (stepData.finalText) {
        finalResultContainer.innerHTML = stepData.finalText;
    }

    // Dibuja las líneas de cobertura si existen para este paso.
    matrixContainer.querySelectorAll('.cover-line').forEach(line => line.remove());
    if (stepData.lines) {
        setTimeout(() => drawCoveringLines(stepData.lines), 50); // Pequeño delay para asegurar que la tabla esté renderizada.
    }

    // Actualiza los controles de navegación del modal.
    document.getElementById("modalStepCounter").textContent = `Paso ${index + 1} de ${steps.length}`;
    document.getElementById("modalPrevBtn").disabled = index === 0;
    document.getElementById("modalNextBtn").disabled = index === steps.length - 1;
}

/**
 * @function drawCoveringLines
 * @description Dibuja las líneas horizontales y verticales sobre la matriz en el modal.
 * @param {{row: boolean[], col: boolean[]}} lines - Objeto que indica qué filas/columnas deben ser cubiertas.
 */

function drawCoveringLines(lines) {
    const container = document.getElementById('modalMatrixContainer');
    const table = container.querySelector('table');
    if (!table) return;

    container.querySelectorAll('.cover-line').forEach(line => line.remove());

    // Dibuja líneas horizontales
    if (lines.row) {
        lines.row.forEach((isCovered, rowIndex) => {
            if (isCovered) {
                const tr = table.rows[rowIndex];
                if (!tr) return;
                const line = document.createElement('div');
                line.className = 'cover-line horizontal';
                line.style.top = `${tr.offsetTop + tr.offsetHeight / 2}px`;
                container.appendChild(line);
            }
        });
    }

    // Dibuja líneas verticales
    if (lines.col) {
        lines.col.forEach((isCovered, colIndex) => {
            if (isCovered) {
                const firstRowCell = table.rows[0]?.cells[colIndex];
                if (!firstRowCell) return;
                const line = document.createElement('div');
                line.className = 'cover-line vertical';
                line.style.left = `${firstRowCell.offsetLeft + firstRowCell.offsetWidth / 2}px`;
                container.appendChild(line);
            }
        });
    }
}