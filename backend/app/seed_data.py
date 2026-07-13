# backend/app/seed_data.py

SHELTERS_DATA = [
    # --- 北区エリア ---
    {"id": "11111111-1111-1111-1111-111111111111", "name": "中央市民体育館", "address": "大阪市北区中崎西2-3-35", "lat": 34.7056, "lon": 135.5063, "capacity": 500, "toilet": 12, "supplies": ["食料", "毛布", "水"]},
    {"id": "22222222-2222-2222-2222-222222222222", "name": "市立扇町小学校", "address": "大阪市北区扇町2-9-33", "lat": 34.7042, "lon": 135.5090, "capacity": 800, "toilet": 20, "supplies": ["食料", "毛布", "水", "医療キット"]},
    {"id": "33333333-3333-3333-3333-333333333333", "name": "市立北野小学校", "address": "大阪市北区茶屋町1-14", "lat": 34.7068, "lon": 135.4998, "capacity": 600, "toilet": 15, "supplies": ["食料", "毛布", "水"]},
    {"id": "44444444-4444-4444-4444-444444444444", "name": "市立豊崎小学校", "address": "大阪市北区本庄西1-11-1", "lat": 34.7125, "lon": 135.5015, "capacity": 700, "toilet": 15, "supplies": ["食料", "毛布"]},
    {"id": "55555555-5555-5555-5555-555555555555", "name": "市立堀川小学校", "address": "大阪市北区東天満2-4-1", "lat": 34.6983, "lon": 135.5122, "capacity": 900, "toilet": 20, "supplies": ["救急キット", "水"]},
    {"id": "66666666-6666-6666-6666-666666666666", "name": "市立西天満小学校", "address": "大阪市北区西天満3-12-21", "lat": 34.6980, "lon": 135.5050, "capacity": 550, "toilet": 10, "supplies": ["毛布", "充電器"]},
    {"id": "77777777-7777-7777-7777-777777777777", "name": "市立天満中学校", "address": "大阪市北区神山町12-9", "lat": 34.7025, "lon": 135.5110, "capacity": 1200, "toilet": 25, "supplies": ["簡易ベッド", "おむつ"]},
    {"id": "88888888-8888-8888-8888-888888888888", "name": "市立菅原小学校", "address": "大阪市北区天神橋1-14-53", "lat": 34.6958, "lon": 135.5175, "capacity": 650, "toilet": 12, "supplies": ["女性用衛生用品", "水"]},
    {"id": "99999999-9999-9999-9999-999999999999", "name": "市立豊崎東小学校", "address": "大阪市北区長柄西1-4-20", "lat": 34.7160, "lon": 135.5115, "capacity": 600, "toilet": 14, "supplies": ["食料", "水"]},
    {"id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "name": "市立済美小学校", "address": "大阪市北区中崎西1-6-10", "lat": 34.7075, "lon": 135.5075, "capacity": 500, "toilet": 11, "supplies": ["簡易トイレ", "食料"]},

    # --- 福島区エリア ---
    {"id": "b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1", "name": "市立福島小学校", "address": "大阪市福島区福島4-5-5", "lat": 34.6915, "lon": 135.4830, "capacity": 700, "toilet": 15, "supplies": ["食料", "水"]},
    {"id": "b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2", "name": "市立上福島小学校", "address": "大阪市福島区福島7-11-20", "lat": 34.6980, "lon": 135.4850, "capacity": 650, "toilet": 14, "supplies": ["毛布", "食料"]},
    {"id": "b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3", "name": "市立玉川小学校", "address": "大阪市福島区玉川4-6-5", "lat": 34.6890, "lon": 135.4760, "capacity": 750, "toilet": 16, "supplies": ["水", "簡易ベッド"]},

    # --- 中央区エリア ---
    {"id": "c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1", "name": "市立愛日小学校（旧称）", "address": "大阪市中央区今橋3-2-20", "lat": 34.6905, "lon": 135.5030, "capacity": 500, "toilet": 12, "supplies": ["食料", "充電器"]},
    {"id": "c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2", "name": "市立開平小学校", "address": "大阪市中央区今橋1-5-7", "lat": 34.6895, "lon": 135.5085, "capacity": 600, "toilet": 13, "supplies": ["毛布", "水"]},
    {"id": "c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3", "name": "市立中央小学校", "address": "大阪市中央区島之内2-1-3", "lat": 34.6710, "lon": 135.5075, "capacity": 1000, "toilet": 22, "supplies": ["食料", "水", "救急キット"]},
    {"id": "c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4", "name": "市立南小学校", "address": "大阪市中央区東心斎橋1-8-32", "lat": 34.6735, "lon": 135.5035, "capacity": 850, "toilet": 19, "supplies": ["水", "おむつ"]},

    # --- 西区エリア ---
    {"id": "d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1", "name": "市立西小学校", "address": "大阪市西区新町3-12-3", "lat": 34.6775, "lon": 135.4890, "capacity": 700, "toilet": 15, "supplies": ["食料", "毛布"]},
    {"id": "d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2", "name": "市立堀江小学校", "address": "大阪市西区北堀江3-2-2", "lat": 34.6715, "lon": 135.4915, "capacity": 900, "toilet": 20, "supplies": ["水", "簡易トイレ"]},
    {"id": "d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3", "name": "市立難波元町小学校", "address": "大阪市浪速区難波中3-5-2", "lat": 34.6625, "lon": 135.4980, "capacity": 800, "toilet": 18, "supplies": ["救急キット", "水"]},

    # --- 天王寺区・阿倍野区エリア ---
    {"id": "e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1", "name": "市立天王寺小学校", "address": "大阪市天王寺区四天王寺1-11-80", "lat": 34.6565, "lon": 135.5135, "capacity": 750, "toilet": 16, "supplies": ["食料", "水"]},
    {"id": "e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2", "name": "市立常盤小学校", "address": "大阪市阿倍野区松崎町3-11-12", "lat": 34.6385, "lon": 135.5170, "capacity": 1100, "toilet": 24, "supplies": ["簡易ベッド", "毛布"]},

    # --- 追加（北区・周辺さらに補完） ---
    {"id": "f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1", "name": "市立中津小学校", "address": "大阪市北区中津3-34-32", "lat": 34.7115, "lon": 135.4895, "capacity": 550, "toilet": 11, "supplies": ["水", "食料"]},
    {"id": "f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2", "name": "市立大淀小学校", "address": "大阪市北区大淀中4-10-33", "lat": 34.7060, "lon": 135.4825, "capacity": 600, "toilet": 13, "supplies": ["充電器", "水"]},
    {"id": "f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3", "name": "市立菅北小学校", "address": "大阪市北区菅栄町9-5", "lat": 34.7110, "lon": 135.5145, "capacity": 650, "toilet": 14, "supplies": ["食料", "簡易トイレ"]},
    {"id": "f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4", "name": "市立扇町中学校", "address": "大阪市北区松ケ枝町1-38", "lat": 34.6955, "lon": 135.5195, "capacity": 1300, "toilet": 28, "supplies": ["医療キット", "簡易ベッド", "水"]},
    {"id": "f5f5f5f5-f5f5-f5f5-f5f5-f5f5f5f5f5f5", "name": "市立中之島小学校", "address": "大阪市北区中之島6-2-55", "lat": 34.6845, "lon": 135.4815, "capacity": 400, "toilet": 10, "supplies": ["食料", "毛布"]}
]