/**
 * --- hungaro.js ---
 * Versión con visualizador de pasos modal y DIBUJO DE LÍNEAS.
 */

let rows = 3;
let cols = 3;
const MAX_SIZE = 6;

document.addEventListener("DOMContentLoaded", () => {
    createTable();
    updateButtonStates();
    document.getElementById("addRowBtn").addEventListener("click", addRow);
    document.getElementById("addColBtn").addEventListener("click", addCol);
    document.getElementById("removeRowBtn").addEventListener("click", removeRow);
    document.getElementById("removeColBtn").addEventListener("click", removeCol);
    document.getElementById("minBtn").addEventListener("click", () => solveHungarian(false));
    document.getElementById("maxBtn").addEventListener("click", () => solveHungarian(true));
});

function updateButtonStates() {
    document.getElementById("addRowBtn").disabled = rows >= MAX_SIZE;
    document.getElementById("addColBtn").disabled = cols >= MAX_SIZE;
    document.getElementById("removeRowBtn").disabled = rows <= 1;
    document.getElementById("removeColBtn").disabled = cols <= 1;
}

function createTable() {
    const table = document.getElementById("costMatrix");
    table.innerHTML = "";
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    headerRow.insertCell().innerHTML = "";
    for (let j = 0; j < cols; j++) {
        const th = document.createElement("th");
        th.innerHTML = `<input type="text" placeholder="Columna ${j + 1}" />`;
        headerRow.appendChild(th);
    }
    const tbody = table.createTBody();
    for (let i = 0; i < rows; i++) {
        const tr = tbody.insertRow();
        const th = document.createElement("th");
        th.innerHTML = `<input type="text" placeholder="Fila ${i + 1}" />`;
        tr.appendChild(th);
        for (let j = 0; j < cols; j++) {
            const td = tr.insertCell();
            td.innerHTML = `<input type="number" placeholder="0" />`;
        }
    }
}

function addRow() {
    if (rows < MAX_SIZE) {
        rows++;
        createTable();
        updateButtonStates();
    }
}

function addCol() {
    if (cols < MAX_SIZE) {
        cols++;
        createTable();
        updateButtonStates();
    }
}

function removeRow() {
    if (rows > 1) {
        rows--;
        createTable();
        updateButtonStates();
    }
}

function removeCol() {
    if (cols > 1) {
        cols--;
        createTable();
        updateButtonStates();
    }
}

function getMatrix() {
    const dataRows = document.querySelectorAll("#costMatrix tbody tr");
    return Array.from(dataRows, tr => Array.from(tr.querySelectorAll("td input[type=number]"), input => parseFloat(input.value) || 0));
}

// --- LÓGICA DEL MÉTODO HÚNGARO CON RECOPILACIÓN DE PASOS ---
function solveHungarian(isMaximization) {
    let detailedSteps = [];
    const originalMatrix = getMatrix();
    if (originalMatrix.length === 0 || originalMatrix[0].length === 0) {
        alert("ERROR: La matriz de costos está vacía.");
        return;
    }

    detailedSteps.push({title: "Paso 0: Matriz Inicial", matrix: JSON.parse(JSON.stringify(originalMatrix))});

    let mat = originalMatrix.map(r => [...r]);
    if (isMaximization) {
        let maxVal = -Infinity;
        mat.forEach(row => row.forEach(val => {
            if (val > maxVal) maxVal = val;
        }));
        mat = mat.map(row => row.map(val => maxVal - val));
        detailedSteps.push({
            title: `Transformación para Maximización (Resta de ${maxVal})`,
            matrix: JSON.parse(JSON.stringify(mat))
        });
    }

    const n = Math.max(mat.length, mat[0].length);
    let isPadded = (n > originalMatrix.length || n > (originalMatrix[0] || []).length);
    if (isPadded) {
        mat.forEach(row => {
            while (row.length < n) row.push(0);
        });
        while (mat.length < n) {
            mat.push(Array(n).fill(0));
        }
        detailedSteps.push({title: "Paso 1: Matriz Cuadrada (con ficticios)", matrix: JSON.parse(JSON.stringify(mat))});
    }

    for (let j = 0; j < n; j++) {
        const col = mat.map(row => row[j]);
        const min = Math.min(...col);
        if (min > 0) {
            for (let i = 0; i < n; i++) mat[i][j] -= min;
        }
    }
    detailedSteps.push({
        title: `Paso ${isPadded ? 2 : 1}: Reducción de Columnas`,
        matrix: JSON.parse(JSON.stringify(mat))
    });

    mat.forEach((row) => {
        const min = Math.min(...row);
        if (min > 0) {
            row.forEach((_, j) => (row[j] -= min));
        }
    });
    detailedSteps.push({
        title: `Paso ${isPadded ? 3 : 2}: Reducción de Filas`,
        matrix: JSON.parse(JSON.stringify(mat))
    });

    let stepCounter = isPadded ? 4 : 3;
    while (true) {
        const {covers, starredZeros} = findMinimumLines(mat);
        const lineCount = covers.row.filter(Boolean).length + covers.col.filter(Boolean).length;

        // Nuevo paso para mostrar las líneas
        detailedSteps.push({
            title: `Paso ${stepCounter}: Trazar líneas (${lineCount}) para cubrir ceros`,
            matrix: JSON.parse(JSON.stringify(mat)),
            lines: JSON.parse(JSON.stringify(covers))
        });

        if (lineCount >= n) {
            let totalValue = 0;
            const rowHeaders = Array.from(document.querySelectorAll("#costMatrix tbody th input"), input => input.value || input.placeholder);
            const colHeaders = Array.from(document.querySelectorAll("#costMatrix thead th input"), input => input.value || input.placeholder);
            const finalAssignment = [];
            for (const row in starredZeros) {
                finalAssignment.push([+row, starredZeros[row]]);
            }
            const resultStr = finalAssignment.map(([r, c]) => {
                if (r < originalMatrix.length && c < originalMatrix[0].length) {
                    totalValue += originalMatrix[r][c];
                }
                return `${rowHeaders[r] || `F${r + 1}`} → ${colHeaders[c] || `C${c + 1}`}`;
            }).join("<br>");
            const resultType = isMaximization ? "Ganancia Máxima" : "Costo Mínimo";
            // ESTE ES EL NUEVO CÓDIGO
            detailedSteps.push({
                title: `--- Solución Óptima Encontrada ---`,
                matrix: originalMatrix, // Usamos la matriz original
                assignment: starredZeros, // Pasamos las coordenadas de la asignación
                finalText: `${resultStr}<br><br><b>${resultType}: ${totalValue}</b>`
            });
            break;
        }

        stepCounter++;
        adjustMatrix(mat, covers);
        detailedSteps.push({title: `Paso ${stepCounter}: Ajuste de Matriz`, matrix: JSON.parse(JSON.stringify(mat))});
        stepCounter++;
    }
    showSolutionModal(detailedSteps);
}

// --- LÓGICA DEL ALGORITMO (findMinimumLines, adjustMatrix, etc. sin cambios mayores) ---
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
    for (const row in starredZeros) {
        coveredCols[starredZeros[row]] = true;
    }
    if (Object.keys(starredZeros).length >= n) {
        return {covers: {row: coveredRows, col: coveredCols}, starredZeros};
    }
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
            path.forEach(([pr, pc]) => {
                if (primedZeros[pr] === pc) starredZeros[pr] = pc;
            });
            coveredRows.fill(false);
            coveredCols.fill(false);
            primedZeros = {};
            for (const row in starredZeros) {
                coveredCols[starredZeros[row]] = true;
            }
        }
    }
    return {covers: {row: coveredRows, col: coveredCols}, starredZeros};
}

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
                mat[i][j] -= minUncovered;
            } else if (covers.row[i] && covers.col[j]) {
                mat[i][j] += minUncovered;
            }
        }
    }
}

// --- FUNCIONES PARA EL MODAL DE SOLUCIÓN ---
function createSolutionModal() {
    if (document.getElementById("solutionModal")) return;
    const modalHTML = `<div id="solutionModal" class="modal-container"><div class="modal-content"><span class="modal-close-btn">&times;</span><h2 id="modalStepTitle"></h2><div id="modalMatrixContainer"></div><div id="modalFinalResult"></div><div class="modal-navigation"><button id="modalPrevBtn">&laquo; Anterior</button><span id="modalStepCounter"></span><button id="modalNextBtn">Siguiente &raquo;</button></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById("solutionModal");
    modal.querySelector(".modal-close-btn").addEventListener("click", hideSolutionModal);
    modal.addEventListener("click", e => {
        if (e.target.id === "solutionModal") hideSolutionModal();
    });
}

function showSolutionModal(steps) {
    createSolutionModal();
    const modal = document.getElementById("solutionModal");
    let currentStepIndex = 0;
    const render = () => renderModalStep(steps, currentStepIndex);
    const next = () => {
        if (currentStepIndex < steps.length - 1) {
            currentStepIndex++;
            render();
        }
    };
    const prev = () => {
        if (currentStepIndex > 0) {
            currentStepIndex--;
            render();
        }
    };
    document.getElementById("modalNextBtn").onclick = next;
    document.getElementById("modalPrevBtn").onclick = prev;
    render();
    modal.style.display = "flex";
    document.body.classList.add("modal-active");
}

function hideSolutionModal() {
    document.getElementById("solutionModal").style.display = "none";
    document.body.classList.remove("modal-active");
}

function renderModalStep(steps, index) {
    const stepData = steps[index];
    document.getElementById("modalStepTitle").innerHTML = stepData.title;
    const matrixContainer = document.getElementById("modalMatrixContainer");
    const finalResultContainer = document.getElementById("modalFinalResult");

    matrixContainer.innerHTML = "";
    finalResultContainer.innerHTML = "";

    // Dibuja la tabla de la matriz
    if (stepData.matrix) {
        const table = document.createElement("table");
        table.className = "modal-matrix";
        const tbody = document.createElement("tbody");
        stepData.matrix.forEach((rowData, r_idx) => {
            const tr = tbody.insertRow();
            rowData.forEach((cellData, c_idx) => {
                const td = tr.insertCell();
                td.textContent = cellData;
                // Si es el paso final, resalta la celda de la asignación
                if (stepData.assignment && stepData.assignment[r_idx] === c_idx) {
                    td.classList.add("highlight-cell");
                }
            });
        });
        table.appendChild(tbody);
        matrixContainer.appendChild(table);
    }

    // Muestra el texto final si existe
    if (stepData.finalText) {
        finalResultContainer.innerHTML = stepData.finalText;
    }

    // Dibuja las líneas de cobertura si existen (no se dibujarán en el paso final)
    matrixContainer.querySelectorAll('.cover-line').forEach(line => line.remove());
    if (stepData.lines) {
        setTimeout(() => drawCoveringLines(stepData.lines), 50);
    }

    // Actualiza la navegación
    document.getElementById("modalStepCounter").textContent = `Paso ${index + 1} de ${steps.length}`;
    document.getElementById("modalPrevBtn").disabled = index === 0;
    document.getElementById("modalNextBtn").disabled = index === steps.length - 1;
}

// NUEVA FUNCIÓN PARA DIBUJAR LÍNEAS
function drawCoveringLines(lines) {
    const container = document.getElementById('modalMatrixContainer');
    const table = container.querySelector('table');
    if (!table) return;

    container.querySelectorAll('.cover-line').forEach(line => line.remove());

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