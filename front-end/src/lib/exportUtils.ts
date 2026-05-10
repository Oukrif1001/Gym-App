/**
 * Utilitaires pour l'export de données au format CSV
 */

/**
 * Convertit un tableau d'objets en format CSV
 * @param data - Tableau d'objets à convertir
 * @param headers - Optionnel: Tableau des en-têtes à inclure. Si non fourni, utilise toutes les clés du premier objet
 * @returns Chaîne de caractères au format CSV
 */
export function convertToCSV(data: any[], headers?: string[]): string {
    if (!data || data.length === 0) {
        return '';
    }

    // Si pas d'en-têtes fournis, utiliser les clés du premier objet
    const csvHeaders = headers || Object.keys(data[0]);

    // Fonction pour échapper les valeurs CSV (gestion des guillemets et virgules)
    const escapeCSVValue = (value: any): string => {
        if (value === null || value === undefined) {
            return '';
        }

        const stringValue = String(value);

        // Si la valeur contient une virgule, un guillemet ou un saut de ligne, on l'entoure de guillemets
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
    };

    // Créer la ligne d'en-têtes
    const headerLine = csvHeaders.map(escapeCSVValue).join(',');

    // Créer les lignes de données
    const dataLines = data.map(row => {
        return csvHeaders.map(header => escapeCSVValue(row[header])).join(',');
    });

    // Combiner en-têtes et données
    return [headerLine, ...dataLines].join('\n');
}

/**
 * Déclenche le téléchargement d'un fichier CSV
 * @param csvContent - Contenu CSV à télécharger
 * @param filename - Nom du fichier (sans extension)
 */
export function downloadCSV(csvContent: string, filename: string): void {
    // Ajouter le BOM UTF-8 pour une meilleure compatibilité avec Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Créer un lien de téléchargement
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Libérer l'URL de l'objet
    URL.revokeObjectURL(url);
}

/**
 * Fonction principale pour exporter des données au format CSV
 * @param data - Données à exporter
 * @param filename - Nom du fichier (sans extension)
 * @param headers - Optionnel: En-têtes spécifiques à utiliser
 */
export function exportData(data: any[], filename: string, headers?: string[]): void {
    if (!data || data.length === 0) {
        console.warn('Aucune donnée à exporter');
        return;
    }

    const csvContent = convertToCSV(data, headers);
    downloadCSV(csvContent, filename);
}

/**
 * Génère un nom de fichier avec la date actuelle
 * @param baseName - Nom de base du fichier
 * @returns Nom de fichier avec date (format: baseName_YYYY-MM-DD)
 */
export function generateFilename(baseName: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${baseName}_${year}-${month}-${day}`;
}

/**
 * Export multiple datasets as separate CSV files
 * @param datasets - Tableau d'objets contenant les données et noms de fichiers
 */
export async function exportMultipleDatasets(
    datasets: Array<{ data: any[]; filename: string; headers?: string[] }>
): Promise<void> {
    for (const dataset of datasets) {
        if (dataset.data && Array.isArray(dataset.data) && dataset.data.length > 0) {
            try {
                exportData(dataset.data, dataset.filename, dataset.headers);
                // Petit délai entre les téléchargements pour éviter les problèmes de navigateur
                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (error) {
                console.error(`Error exporting ${dataset.filename}:`, error);
            }
        } else {
            console.warn(`Skipping ${dataset.filename} - no data to export`);
        }
    }
}
