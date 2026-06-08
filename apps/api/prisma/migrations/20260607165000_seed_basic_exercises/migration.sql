-- Seed fixed "basic exercises" catalog (system exercises).
-- Coaches should not edit these; they are used as the baseline library.
-- Insert is idempotent thanks to UNIQUE(source, sourceId).

INSERT INTO "Exercise" (
  "id",
  "coachUserId",
  "name",
  "primaryMuscle",
  "equipment",
  "difficulty",
  "objective",
  "isSystem",
  "youtubeUrl",
  "source",
  "sourceId",
  "createdAt",
  "updatedAt"
) VALUES
  -- Chest (10)
  (gen_random_uuid(), NULL, 'Press de banca', 'chest', 'Barra', 'beginner', 'strength', true, NULL, 'regen_basic_v1', 'bench_press_barbell', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Press inclinado con mancuernas', 'chest', 'Mancuernas', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'incline_dumbbell_press', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Press inclinado con barra', 'chest', 'Barra', 'intermediate', 'strength', true, NULL, 'regen_basic_v1', 'incline_barbell_press', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Aperturas con mancuernas', 'chest', 'Mancuernas', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'dumbbell_fly', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Aperturas en polea', 'chest', 'Polea', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'cable_fly', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Flexiones de brazos', 'chest', 'Peso corporal', 'beginner', 'strength', true, NULL, 'regen_basic_v1', 'push_up', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Fondos en paralelas', 'triceps', 'Peso corporal', 'advanced', 'strength', true, NULL, 'regen_basic_v1', 'dips', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Press en máquina', 'chest', 'Máquina', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'chest_press_machine', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Press en Smith', 'chest', 'Máquina', 'beginner', 'strength', true, NULL, 'regen_basic_v1', 'smith_bench_press', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Press declinado', 'chest', 'Barra', 'intermediate', 'strength', true, NULL, 'regen_basic_v1', 'decline_bench_press', NOW(), NOW()),

  -- Back (10)
  (gen_random_uuid(), NULL, 'Dominadas', 'back', 'Peso corporal', 'advanced', 'strength', true, NULL, 'regen_basic_v1', 'pull_up', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Jalón al pecho', 'back', 'Polea', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'lat_pulldown', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Remo con barra', 'back', 'Barra', 'intermediate', 'strength', true, NULL, 'regen_basic_v1', 'barbell_row', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Remo con mancuernas (a una mano)', 'back', 'Mancuernas', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'one_arm_dumbbell_row', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Remo en máquina', 'back', 'Máquina', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'machine_row', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Remo sentado en polea', 'back', 'Polea', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'seated_cable_row', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Peso muerto', 'back', 'Barra', 'intermediate', 'strength', true, NULL, 'regen_basic_v1', 'deadlift', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Peso muerto rumano', 'glutes', 'Barra', 'intermediate', 'hypertrophy', true, NULL, 'regen_basic_v1', 'romanian_deadlift', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Face pull', 'shoulders', 'Polea', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'face_pull', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Pullover en polea', 'back', 'Polea', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'cable_pullover', NOW(), NOW()),

  -- Shoulders (10)
  (gen_random_uuid(), NULL, 'Press militar', 'shoulders', 'Barra', 'intermediate', 'strength', true, NULL, 'regen_basic_v1', 'overhead_press', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Press militar con mancuernas', 'shoulders', 'Mancuernas', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'dumbbell_overhead_press', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Elevaciones laterales', 'shoulders', 'Mancuernas', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'lateral_raise', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Elevaciones laterales en polea', 'shoulders', 'Polea', 'intermediate', 'hypertrophy', true, NULL, 'regen_basic_v1', 'cable_lateral_raise', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Pájaros (deltoides posterior)', 'shoulders', 'Mancuernas', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'rear_delt_fly', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Pájaros en máquina', 'shoulders', 'Máquina', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'reverse_pec_deck', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Encogimientos de trapecio', 'back', 'Mancuernas', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'shrug', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Remo al mentón', 'shoulders', 'Barra', 'intermediate', 'hypertrophy', true, NULL, 'regen_basic_v1', 'upright_row', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Press en máquina (hombros)', 'shoulders', 'Máquina', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'shoulder_press_machine', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Elevaciones frontales', 'shoulders', 'Mancuernas', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'front_raise', NOW(), NOW()),

  -- Legs (10)
  (gen_random_uuid(), NULL, 'Sentadilla libre', 'legs', 'Barra', 'intermediate', 'strength', true, NULL, 'regen_basic_v1', 'back_squat', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Sentadilla frontal', 'legs', 'Barra', 'advanced', 'strength', true, NULL, 'regen_basic_v1', 'front_squat', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Prensa 45°', 'legs', 'Máquina', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'leg_press', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Zancadas', 'glutes', 'Mancuernas', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'lunges', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Sentadilla búlgara', 'glutes', 'Mancuernas', 'intermediate', 'hypertrophy', true, NULL, 'regen_basic_v1', 'bulgarian_split_squat', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Extensión de cuádriceps', 'legs', 'Máquina', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'leg_extension', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Curl femoral', 'legs', 'Máquina', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'leg_curl', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Elevación de gemelos', 'calves', 'Máquina', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'calf_raise_machine', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Elevación de gemelos de pie', 'calves', 'Peso corporal', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'standing_calf_raise', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Sentadilla goblet', 'legs', 'Mancuernas', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'goblet_squat', NOW(), NOW()),

  -- Biceps (10)
  (gen_random_uuid(), NULL, 'Curl bíceps alterno', 'biceps', 'Mancuernas', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'dumbbell_curl', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Curl bíceps con barra', 'biceps', 'Barra', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'barbell_curl', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Curl martillo', 'biceps', 'Mancuernas', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'hammer_curl', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Curl en polea', 'biceps', 'Polea', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'cable_curl', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Curl inclinado', 'biceps', 'Mancuernas', 'intermediate', 'hypertrophy', true, NULL, 'regen_basic_v1', 'incline_dumbbell_curl', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Curl predicador', 'biceps', 'Máquina', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'preacher_curl', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Curl concentración', 'biceps', 'Mancuernas', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'concentration_curl', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Curl reverse', 'biceps', 'Barra', 'intermediate', 'hypertrophy', true, NULL, 'regen_basic_v1', 'reverse_curl', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Curl spider', 'biceps', 'Mancuernas', 'intermediate', 'hypertrophy', true, NULL, 'regen_basic_v1', 'spider_curl', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Curl en banco Scott', 'biceps', 'Barra', 'intermediate', 'hypertrophy', true, NULL, 'regen_basic_v1', 'ez_bar_preacher_curl', NOW(), NOW()),

  -- Triceps (10)
  (gen_random_uuid(), NULL, 'Extensión de tríceps en polea', 'triceps', 'Polea', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'triceps_pushdown', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Extensión por encima de la cabeza', 'triceps', 'Mancuernas', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'overhead_triceps_extension', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Press francés', 'triceps', 'Barra', 'intermediate', 'hypertrophy', true, NULL, 'regen_basic_v1', 'skullcrusher', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Fondos en banco', 'triceps', 'Peso corporal', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'bench_dips', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Extensión con cuerda', 'triceps', 'Polea', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'rope_pushdown', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Extensión unilateral en polea', 'triceps', 'Polea', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'single_arm_pushdown', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Press cerrado', 'triceps', 'Barra', 'intermediate', 'strength', true, NULL, 'regen_basic_v1', 'close_grip_bench_press', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Extensión en máquina', 'triceps', 'Máquina', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'triceps_extension_machine', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Patada de tríceps', 'triceps', 'Mancuernas', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'triceps_kickback', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Press en polea (tríceps)', 'triceps', 'Polea', 'intermediate', 'hypertrophy', true, NULL, 'regen_basic_v1', 'cable_close_grip_press', NOW(), NOW()),

  -- Core (10)
  (gen_random_uuid(), NULL, 'Plancha', 'core', 'Peso corporal', 'beginner', 'skill', true, NULL, 'regen_basic_v1', 'plank', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Plancha lateral', 'core', 'Peso corporal', 'beginner', 'skill', true, NULL, 'regen_basic_v1', 'side_plank', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Crunch', 'core', 'Peso corporal', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'crunch', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Crunch en polea', 'core', 'Polea', 'intermediate', 'hypertrophy', true, NULL, 'regen_basic_v1', 'cable_crunch', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Elevación de piernas colgado', 'core', 'Peso corporal', 'advanced', 'strength', true, NULL, 'regen_basic_v1', 'hanging_leg_raise', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Elevación de piernas', 'core', 'Peso corporal', 'beginner', 'hypertrophy', true, NULL, 'regen_basic_v1', 'leg_raise', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Ab wheel', 'core', 'Accesorio', 'advanced', 'strength', true, NULL, 'regen_basic_v1', 'ab_wheel', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Pallof press', 'core', 'Polea', 'beginner', 'skill', true, NULL, 'regen_basic_v1', 'pallof_press', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Bird dog', 'core', 'Peso corporal', 'beginner', 'mobility', true, NULL, 'regen_basic_v1', 'bird_dog', NOW(), NOW()),
  (gen_random_uuid(), NULL, 'Dead bug', 'core', 'Peso corporal', 'beginner', 'skill', true, NULL, 'regen_basic_v1', 'dead_bug', NOW(), NOW())

ON CONFLICT ("source", "sourceId") DO NOTHING;
