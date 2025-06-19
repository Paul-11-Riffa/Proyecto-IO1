/** <-- El comentario EMPIEZA con esta línea
 * Función principal y unificada para resolver por el Método Húngaro.
 * Acepta un parámetro booleano para determinar si es un problema de minimización o maximización.
 * @param {boolean} isMaximization - Poner 'true' para maximizar, 'false' para minimizar.
 */

let rows = 1;
let cols = 1;
document.addEventListener("DOMContentLoaded", () => {
    createTable();

    // Botones para manipular la tabla
    document.getElementById("addRowBtn").addEventListener("click", addRow);
    document.getElementById("addColBtn").addEventListener("click", addCol);
    document.getElementById("removeRowBtn").addEventListener("click", removeRow);
    document.getElementById("removeColBtn").addEventListener("click", removeCol);
    // Conectar los nuevos botones de resolución a la función principal
    document
        .getElementById("minBtn")
        .addEventListener("click", () => solveHungarian(false));
    document
        .getElementById("maxBtn")
        .addEventListener("click", () => solveHungarian(true));
});

// --- FUNCIONES DE LA INTERFAZ (UI) ---
function createTable() {
    const table = document.getElementById("costMatrix");
    table.innerHTML = "";
    for (let i = 0; i < rows; i++) {
        const tr = table.insertRow();
        for (let j = 0; j < cols; j++) {
            const td = tr.insertCell();
            const value = Math.floor(Math.random() * 20) + 1;
            td.innerHTML = `<input type="number" value="${value}" />`;
        }
    }
}

function addRow() {
    rows++;
    createTable();
}

function addCol() {
    cols++;
    createTable();
}

function removeRow() {
    // Nos aseguramos de no eliminar la última fila
    if (rows > 1) {
        rows--;
        createTable();
    }
}

function removeCol() {
    // Nos aseguramos de no eliminar la última columna
    if (cols > 1) {
        cols--;
        createTable();
    }
}

function getMatrix() {
    const table = document.querySelectorAll("#costMatrix tr");
    return Array.from(table, (tr) =>
        Array.from(tr.cells, (td) => +td.firstElementChild.value)
    );
}

function logSteps(steps) {
    document.getElementById("steps").textContent = steps.join("\n");
}

// --- LÓGICA DEL MÉTODO HÚNGARO ---
function solveHungarian(isMaximization) {
    const steps = ["--- Método Húngaro Iniciado ---"];

    steps.push(
        `MODO DE CÁLCULO: ${isMaximization ? "MAXIMIZACIÓN" : "MINIMIZACIÓN"}`
    );
    steps.push("---------------------------------");

    const originalMatrix = getMatrix();
    let mat = originalMatrix.map((r) => [...r]);

    if (isMaximization) {
        steps.push("Transformando matriz para maximización...");
        let maxVal = -Infinity;
        mat.forEach((row) =>
            row.forEach((val) => {
                if (val > maxVal) maxVal = val;
            })
        );
        steps.push(`Valor máximo encontrado: ${maxVal}.`);
        mat = mat.map((row) => row.map((val) => maxVal - val));
        steps.push(
            "Matriz de 'Costo de Oportunidad' generada:",
            ...mat.map((r) => r.join("\t"))
        );
    }

    const n = Math.max(mat.length, mat[0].length);
    mat.forEach((row) => {
        while (row.length < n) row.push(0);
    });
    while (mat.length < n) {
        mat.push(Array(n).fill(0));
    }
    steps.push(
        "Matriz Cuadrada (con ficticios si es necesario):",
        ...mat.map((r) => r.join("\t"))
    );
    steps.push("---------------------------------");
    for (let j = 0; j < n; j++) {
        const col = mat.map((row) => row[j]);
        const min = Math.min(...col);

        if (min > 0) {
            steps.push(`Columna ${j + 1}: restar ${min}`);
            for (let i = 0; i < n; i++) mat[i][j] -= min;
        }
    }
    steps.push("---------------------------------");
    steps.push("Después de reducir columnas:", ...mat.map((r) => r.join("\t")));
    steps.push("---------------------------------");
    mat.forEach((row, i) => {
        const min = Math.min(...row);
        if (min > 0) {
            steps.push(`Fila ${i + 1}: restar ${min}`);
            row.forEach((_, j) => (row[j] -= min));
        }
    });
    steps.push("---------------------------------");
    steps.push("Después de reducir filas:", ...mat.map((r) => r.join("\t")));

    let assignment = {};
    while (true) {
        const {covers, starredZeros} = findMinimumLines(mat);
        const lineCount =
            covers.row.filter(Boolean).length + covers.col.filter(Boolean).length;
        steps.push("---------------------------------");
        steps.push(`Intento de cobertura: ${lineCount} líneas encontradas.`);
        steps.push("---------------------------------");
        if (lineCount >= n) {
            assignment = starredZeros;
            steps.push("--- Cobertura Óptima Encontrada ---");
            steps.push("---------------------------------");
            break;
        }
        steps.push("---------------------------------");
        steps.push(
            "El número de líneas es menor que n. Se necesita ajustar la matriz."
        );
        steps.push("---------------------------------");
        adjustMatrix(mat, covers, steps);
    }

    const finalAssignment = [];
    for (const row in assignment) {
        finalAssignment.push([+row, assignment[row]]);
    }

    let totalValue = 0;
    const resultStr = finalAssignment
        .map(([r, c]) => {
            if (r < originalMatrix.length && c < originalMatrix[0].length) {
                totalValue += originalMatrix[r][c];
            }
            return `F${r + 1}→C${c + 1}`;
        })
        .join(", ");

    steps.push("--- Asignación Final Óptima ---");
    steps.push("---------------------------------");
    steps.push(`Resultado: ${resultStr}`);
    steps.push("---------------------------------");
    const resultType = isMaximization ? "Ganancia Máxima" : "Costo Mínimo";
    steps.push(`${resultType}: ${totalValue}`);

    logSteps(steps);
}

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
                const starRow = Object.keys(starredZeros).find(
                    (key) => starredZeros[key] === currentCol
                );
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

function adjustMatrix(mat, covers, steps) {
    const n = mat.length;
    let minUncovered = Infinity;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (!covers.row[i] && !covers.col[j] && mat[i][j] < minUncovered) {
                minUncovered = mat[i][j];
            }
        }
    }
    steps.push(`El menor valor no cubierto es ${minUncovered}.`);

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (!covers.row[i] && !covers.col[j]) {
                mat[i][j] -= minUncovered;
            } else if (covers.row[i] && covers.col[j]) {
                mat[i][j] += minUncovered;
            }
        }
    }
    steps.push("Matriz tras el ajuste:", ...mat.map((r) => r.join("\t")));
}
