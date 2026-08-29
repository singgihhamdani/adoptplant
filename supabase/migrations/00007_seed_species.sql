-- 00007_seed_species.sql
-- Seed initial native Indonesian species catalog for land rehabilitation

INSERT INTO public.species (common_name, scientific_name, category, native) VALUES
    ('Sengon', 'Falcataria moluccana', 'TREE', true),
    ('Trembesi', 'Samanea saman', 'TREE', false),
    ('Mahoni', 'Swietenia macrophylla', 'TREE', false),
    ('Jati', 'Tectona grandis', 'TREE', true),
    ('Merbau', 'Intsia bijuga', 'TREE', true),
    ('Cempaka', 'Magnolia champaca', 'TREE', true),
    ('Damar', 'Agathis dammara', 'TREE', true),
    ('Gmelina / Jati Putih', 'Gmelina arborea', 'TREE', false),
    ('Beringin', 'Ficus benjamina', 'TREE', true),
    ('Nyamplung', 'Calophyllum inophyllum', 'TREE', true),
    ('Bakau Kurap', 'Rhizophora mucronata', 'MANGROVE', true),
    ('Bakau Minyak', 'Rhizophora apiculata', 'MANGROVE', true),
    ('Api-api Putih', 'Avicennia marina', 'MANGROVE', true),
    ('Pedada', 'Sonneratia alba', 'MANGROVE', true),
    ('Kaliandra', 'Calliandra calothyrsus', 'SHRUB', false),
    ('Rumput Vetiver', 'Chrysopogon zizanioides', 'GRASS', true)
ON CONFLICT DO NOTHING;
