import json

with open('/home/nickj/Documents/Soapmaker_App/SoapManager/all_oils_complete.json') as f:
    oils = json.load(f)

def categorize(name):
    n = name.lower()
    if any(w in n for w in ['butter', 'cocoa']):
        return 'Butter'
    if any(w in n for w in ['wax', 'beeswax', 'candelilla']):
        return 'Wax'
    if any(w in n for w in ['tallow', 'lard', 'fat', 'ghee', 'milk fat', 'emu', 'mink', 'horse oil', 'salmon', 'chicken']):
        return 'Animal Fat'
    if 'acid' in n:
        return 'Fatty Acid'
    if any(w in n for w in ['crisco', 'shortening', 'soapquick']):
        return 'Blend'
    if 'pine tar' in n:
        return 'Additive'
    return 'Oil'

lines = []
lines.append("-- SoapBuddy Complete Oil/Fat/Wax Seed Data")
lines.append(f"-- Total: {len(oils)} ingredients from SoapCalc.net")
lines.append("")

for i, oil in enumerate(oils):
    name = oil['name'].replace("'", "''").strip()
    cat = categorize(oil['name'])
    sap_naoh = oil['sap_naoh']
    sap_koh = oil['sap_koh']
    q = oil['qualities']
    fa = oil['fatty_acids']
    
    lines.append(f"INSERT INTO ingredients (name, category, sap_naoh, sap_koh, unit) VALUES ('{name}', '{cat}', {sap_naoh}, {sap_koh}, 'g') ON CONFLICT (name) DO UPDATE SET sap_naoh = {sap_naoh}, sap_koh = {sap_koh}, category = '{cat}';")
    lines.append(f"INSERT INTO fatty_acid_profiles (ingredient_id, lauric, myristic, palmitic, stearic, ricinoleic, oleic, linoleic, linolenic, hardness, cleansing, conditioning, bubbly, creamy, iodine, ins) VALUES ((SELECT id FROM ingredients WHERE name = '{name}'), {fa['lauric']}, {fa['myristic']}, {fa['palmitic']}, {fa['stearic']}, {fa['ricinoleic']}, {fa['oleic']}, {fa['linoleic']}, {fa['linolenic']}, {q['hardness']}, {q['cleansing']}, {q['conditioning']}, {q['bubbly']}, {q['creamy']}, {q['iodine']}, {q['ins']}) ON CONFLICT (ingredient_id) DO UPDATE SET lauric = {fa['lauric']}, myristic = {fa['myristic']}, palmitic = {fa['palmitic']}, stearic = {fa['stearic']}, ricinoleic = {fa['ricinoleic']}, oleic = {fa['oleic']}, linoleic = {fa['linoleic']}, linolenic = {fa['linolenic']}, hardness = {q['hardness']}, cleansing = {q['cleansing']}, conditioning = {q['conditioning']}, bubbly = {q['bubbly']}, creamy = {q['creamy']}, iodine = {q['iodine']}, ins = {q['ins']};")
    lines.append("")

sql = "\n".join(lines)

with open('/home/nickj/Documents/Soapmaker_App/SoapManager/seed_oils.sql', 'w') as f:
    f.write(sql)

print(f"Generated seed_oils.sql with {len(oils)} oil entries")
