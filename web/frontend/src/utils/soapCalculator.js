/**
 * Soap Calculator Utility
 * Ported from Python src/services/soap_calculator.py
 * 
 * Calculates soap qualities (Hardness, Cleansing, Conditioning, Bubbly, Creamy)
 * based on the weighted average of fatty acid profiles of the oils in a recipe.
 */

export const calculateSoapQualities = (ingredients, fattyAcidProfiles) => {
    /**
     * ingredients: Array of { ingredient_id, quantity }
     * fattyAcidProfiles: Object mapping ingredient_id to profile object
     * Returns a quality results object.
     */

    let totalWeight = 0;
    const weightedProfiles = {
        lauric: 0, myristic: 0, palmitic: 0, stearic: 0,
        ricinoleic: 0, oleic: 0, linoleic: 0, linolenic: 0,
        iodine: 0, ins: 0
    };

    // Filter for oils only and calculate total weight
    const validIngredients = [];

    ingredients.forEach(item => {
        const profile = fattyAcidProfiles[item.ingredient_id];
        const qty = parseFloat(item.quantity) || 0;

        if (profile && qty > 0) {
            validIngredients.push({ profile, qty });
            totalWeight += qty;
        }
    });

    if (totalWeight === 0) {
        return {
            hardness: 0,
            cleansing: 0,
            conditioning: 0,
            bubbly: 0,
            creamy: 0,
            iodine: 0,
            ins: 0
        };
    }

    // Calculate weighted averages of Fatty Acids
    validIngredients.forEach(({ profile, qty }) => {
        const ratio = qty / totalWeight;
        weightedProfiles.lauric += (parseFloat(profile.lauric) || 0) * ratio;
        weightedProfiles.myristic += (parseFloat(profile.myristic) || 0) * ratio;
        weightedProfiles.palmitic += (parseFloat(profile.palmitic) || 0) * ratio;
        weightedProfiles.stearic += (parseFloat(profile.stearic) || 0) * ratio;
        weightedProfiles.ricinoleic += (parseFloat(profile.ricinoleic) || 0) * ratio;
        weightedProfiles.oleic += (parseFloat(profile.oleic) || 0) * ratio;
        weightedProfiles.linoleic += (parseFloat(profile.linoleic) || 0) * ratio;
        weightedProfiles.linolenic += (parseFloat(profile.linolenic) || 0) * ratio;
        weightedProfiles.iodine += (parseFloat(profile.iodine) || 0) * ratio;
        weightedProfiles.ins += (parseFloat(profile.ins) || 0) * ratio;
    });

    // Calculate Soap Qualities based on standard soapmaking formulas:

    // Hardness: Lauric + Myristic + Palmitic + Stearic
    const hardness = weightedProfiles.lauric + weightedProfiles.myristic +
        weightedProfiles.palmitic + weightedProfiles.stearic;

    // Cleansing: Lauric + Myristic
    const cleansing = weightedProfiles.lauric + weightedProfiles.myristic;

    // Conditioning: Oleic + Linoleic + Linolenic + Ricinoleic
    const conditioning = weightedProfiles.oleic + weightedProfiles.linoleic +
        weightedProfiles.linolenic + weightedProfiles.ricinoleic;

    // Bubbly: Lauric + Myristic + Ricinoleic
    const bubbly = weightedProfiles.lauric + weightedProfiles.myristic +
        weightedProfiles.ricinoleic;

    // Creamy: Palmitic + Stearic + Ricinoleic
    const creamy = weightedProfiles.palmitic + weightedProfiles.stearic +
        weightedProfiles.ricinoleic;

    return {
        hardness: Number(hardness.toFixed(1)),
        cleansing: Number(cleansing.toFixed(1)),
        conditioning: Number(conditioning.toFixed(1)),
        bubbly: Number(bubbly.toFixed(1)),
        creamy: Number(creamy.toFixed(1)),
        iodine: Number(weightedProfiles.iodine.toFixed(1)),
        ins: Number(weightedProfiles.ins.toFixed(1))
    };
};
