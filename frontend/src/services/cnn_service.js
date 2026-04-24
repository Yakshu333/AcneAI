import { NEW_ACNE_DATA } from '../constants/acneData';

const API_URL = 'http://127.0.0.1:5000';

/**
 * Maps the predicted class name to the data in NEW_ACNE_DATA
 */
const getAcneInfoByName = (predictedName) => {
    // Normalize names for comparison
    const searchName = predictedName.toLowerCase().replace(/s$/, ''); // Remove trailing 's'

    for (const type of Object.keys(NEW_ACNE_DATA)) {
        for (const acne of NEW_ACNE_DATA[type]) {
            const dataName = acne.name.toLowerCase().replace(/s$/, '');
            if (dataName === searchName) {
                return { ...acne, type };
            }
        }
    }

    // Fallback if not found
    return {
        name: predictedName,
        emoji: '❓',
        severity: 'Unknown',
        description: 'Information not found for this type.',
        appearance: 'Unknown',
        causes: 'Unknown',
        type: 'Unknown'
    };
};

/**
 * Identifies the type of acne by sending the image to the Python Flask backend.
 * @param {File} imageFile - The actual file object from the input.
 * @param {string|null} userId - The optional ID of the logged-in user.
 */
export const identifyAcne = async (imageFile, userId = null) => {
    try {
        const formData = new FormData();
        formData.append('file', imageFile);

        if (userId) {
            formData.append('userId', userId);
        }

        const response = await fetch(`${API_URL}/predict`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error || data.detail) {
            throw new Error(data.error || data.detail);
        }

        // data.type from the API holds the class name (e.g., "Blackheads")
        const acneInfo = getAcneInfoByName(data.type);
        const confidence = parseFloat(data.confidence);

        // Calculate a severity score (1-10) based on category and confidence
        let severityScore = 0;
        if (acneInfo.severity === 'Mild') {
            severityScore = 1 + (confidence * 2); // 1.0 - 3.0
        } else if (acneInfo.severity === 'Moderate') {
            severityScore = 4 + (confidence * 2); // 4.0 - 6.0
        } else if (acneInfo.severity === 'Severe') {
            severityScore = 7 + (confidence * 3); // 7.0 - 10.0
        }

        return {
            ...acneInfo,
            confidence: (confidence * 100).toFixed(2),
            severityScore: severityScore.toFixed(1)
        };
    } catch (error) {
        console.error('Error during acne identification:', error);
        throw error;
    }
};
