-- Gabarito App — Seed: Banco do Brasil 2023, Agente de Tecnologia
-- ATENÇÃO: substitua 'SEU_USER_ID_AQUI' pelo UUID do usuário autenticado.
-- Você pode obter o UUID via: SELECT id FROM auth.users LIMIT 1;

DO $$
DECLARE
  v_user_id   uuid := '319be6b4-f04b-4f11-a0e7-e639010800cf';
  v_concurso  uuid;
  d_bd        uuid;
  d_eda       uuid;
  d_bigdata   uuid;
  d_ml        uuid;
  d_mobile    uuid;
  d_ferramentas uuid;
  d_port      uuid;
  d_ingles    uuid;
  d_mat       uuid;
  d_fin       uuid;
BEGIN

  -- ── Concurso ───────────────────────────────────────────────────────────────
  INSERT INTO concursos (user_id, nome, cargo, ano, banca)
  VALUES (v_user_id, 'Banco do Brasil 2023', 'Agente de Tecnologia', '2023', 'Cesgranrio')
  RETURNING id INTO v_concurso;

  -- ── Banco de Dados ─────────────────────────────────────────────────────────
  INSERT INTO disciplinas (concurso_id, nome, ordem) VALUES (v_concurso, 'Banco de Dados', 0) RETURNING id INTO d_bd;
  INSERT INTO topicos (disciplina_id, texto, ordem) VALUES
    (d_bd, 'Conceitos de BD e SGBD', 0),
    (d_bd, 'Modelo relacional (conceitos, chaves)', 1),
    (d_bd, 'Modelagem entidade-relacionamento', 2),
    (d_bd, 'Normalização (1FN, 2FN, 3FN)', 3),
    (d_bd, 'Linguagem SQL', 4),
    (d_bd, 'PostgreSQL', 5),
    (d_bd, 'NoSQL (chave/valor, documento, coluna, grafo)', 6),
    (d_bd, 'MongoDB', 7),
    (d_bd, 'Data Warehouse e modelagem dimensional', 8);
  INSERT INTO flashcards (disciplina_id, frente, verso) VALUES
    (d_bd, 'O que caracteriza a 2ª Forma Normal (2FN)?', 'A tabela está na 1FN e todo atributo não-chave depende da chave primária inteira. Elimina dependência parcial. Só importa quando a chave é composta.'),
    (d_bd, 'Os 4 tipos principais de banco NoSQL e um exemplo de cada?', 'Chave/valor (Redis), Documento (MongoDB), Coluna (Cassandra) e Grafo (Neo4j).'),
    (d_bd, 'O que é normalização?', 'Processo de organizar tabelas para reduzir redundância e evitar anomalias de inserção, atualização e exclusão.'),
    (d_bd, 'Diferença entre chave primária e chave estrangeira?', 'Chave primária identifica unicamente cada linha. Chave estrangeira referencia a chave primária de outra tabela, criando o relacionamento.');
  INSERT INTO questoes (disciplina_id, enunciado, alternativas, correta, explicacao) VALUES
    (d_bd, 'Na modelagem relacional, o processo que organiza os dados para reduzir redundância e evitar anomalias de atualização é a:',
      '[{"letra":"A","texto":"Indexação"},{"letra":"B","texto":"Normalização"},{"letra":"C","texto":"Desnormalização"},{"letra":"D","texto":"Cardinalidade"},{"letra":"E","texto":"Agregação"}]',
      'B', 'Normalização aplica as formas normais (1FN, 2FN, 3FN) para reduzir redundância.'),
    (d_bd, 'Qual banco de dados NoSQL é classificado como orientado a documentos?',
      '[{"letra":"A","texto":"Redis"},{"letra":"B","texto":"Cassandra"},{"letra":"C","texto":"Neo4j"},{"letra":"D","texto":"MongoDB"},{"letra":"E","texto":"MySQL"}]',
      'D', 'MongoDB armazena documentos (JSON/BSON). Redis é chave/valor, Cassandra é coluna, Neo4j é grafo.');

  -- ── Estrutura de Dados e Algoritmos ────────────────────────────────────────
  INSERT INTO disciplinas (concurso_id, nome, ordem) VALUES (v_concurso, 'Estrutura de Dados e Algoritmos', 1) RETURNING id INTO d_eda;
  INSERT INTO topicos (disciplina_id, texto, ordem) VALUES
    (d_eda, 'Busca sequencial e binária', 0),
    (d_eda, 'Ordenação bolha', 1),
    (d_eda, 'Ordenação por seleção', 2),
    (d_eda, 'Ordenação por inserção', 3),
    (d_eda, 'Lista encadeada', 4),
    (d_eda, 'Pilha (LIFO)', 5),
    (d_eda, 'Fila (FIFO)', 6),
    (d_eda, 'Noções de árvore binária', 7);
  INSERT INTO flashcards (disciplina_id, frente, verso) VALUES
    (d_eda, 'Diferença entre Pilha e Fila?', 'Pilha = LIFO, último a entrar é o primeiro a sair (ex: Ctrl+Z). Fila = FIFO, primeiro a entrar é o primeiro a sair (ex: fila de impressão).'),
    (d_eda, 'Pré-requisito da busca binária?', 'O array precisa estar ordenado. A cada passo ela descarta metade dos elementos, com complexidade O(log n).'),
    (d_eda, 'Como funciona o bubble sort?', 'Compara pares adjacentes e troca quando estão fora de ordem, repetindo passagens até não haver mais trocas. Complexidade O(n²).');
  INSERT INTO questoes (disciplina_id, enunciado, alternativas, correta, explicacao) VALUES
    (d_eda, 'Uma estrutura de dados na qual o último elemento inserido é o primeiro a ser removido é chamada de:',
      '[{"letra":"A","texto":"Fila"},{"letra":"B","texto":"Lista circular"},{"letra":"C","texto":"Pilha"},{"letra":"D","texto":"Árvore binária"},{"letra":"E","texto":"Grafo"}]',
      'C', 'Pilha segue a lógica LIFO (Last In, First Out).'),
    (d_eda, 'A busca binária só pode ser aplicada quando o conjunto de dados está:',
      '[{"letra":"A","texto":"Em formato de pilha"},{"letra":"B","texto":"Ordenado"},{"letra":"C","texto":"Duplicado"},{"letra":"D","texto":"Vazio"},{"letra":"E","texto":"Em uma fila"}]',
      'B', 'A busca binária depende da ordenação prévia para descartar metade do espaço de busca a cada passo.');

  -- ── Big Data ───────────────────────────────────────────────────────────────
  INSERT INTO disciplinas (concurso_id, nome, ordem) VALUES (v_concurso, 'Big Data', 2) RETURNING id INTO d_bigdata;
  INSERT INTO topicos (disciplina_id, texto, ordem) VALUES
    (d_bigdata, 'Fundamentos de Big Data', 0),
    (d_bigdata, 'Os Vs: Volume, Velocidade, Variedade, Veracidade, Valor', 1),
    (d_bigdata, 'Técnicas de preparação de dados', 2),
    (d_bigdata, 'Técnicas de apresentação de dados', 3);
  INSERT INTO flashcards (disciplina_id, frente, verso) VALUES
    (d_bigdata, 'Quais são os Vs do Big Data?', 'Volume, Velocidade e Variedade (os 3 clássicos), mais Veracidade e Valor.'),
    (d_bigdata, 'O que é Variedade no contexto de Big Data?', 'A diversidade de formatos e fontes dos dados: estruturados, semiestruturados e não estruturados (texto, imagem, vídeo, logs).');
  INSERT INTO questoes (disciplina_id, enunciado, alternativas, correta, explicacao) VALUES
    (d_bigdata, 'No contexto de Big Data, a característica que se refere à quantidade massiva de dados gerados e armazenados é o:',
      '[{"letra":"A","texto":"Valor"},{"letra":"B","texto":"Volume"},{"letra":"C","texto":"Veracidade"},{"letra":"D","texto":"Velocidade"},{"letra":"E","texto":"Variedade"}]',
      'B', 'Volume trata da escala/quantidade de dados. Velocidade é o ritmo de geração; Variedade é a diversidade de formatos.');

  -- ── Aprendizagem de Máquina ────────────────────────────────────────────────
  INSERT INTO disciplinas (concurso_id, nome, ordem) VALUES (v_concurso, 'Aprendizagem de Máquina', 3) RETURNING id INTO d_ml;
  INSERT INTO topicos (disciplina_id, texto, ordem) VALUES
    (d_ml, 'Noções de ML', 0),
    (d_ml, 'Aprendizado supervisionado', 1),
    (d_ml, 'Aprendizado não supervisionado', 2),
    (d_ml, 'Noções de NLP (Processamento de Linguagem Natural)', 3);

  -- ── Desenvolvimento Mobile ──────────────────────────────────────────────────
  INSERT INTO disciplinas (concurso_id, nome, ordem) VALUES (v_concurso, 'Desenvolvimento Mobile', 4) RETURNING id INTO d_mobile;
  INSERT INTO topicos (disciplina_id, texto, ordem) VALUES
    (d_mobile, 'Java e Kotlin (Android)', 0),
    (d_mobile, 'Swift (iOS)', 1),
    (d_mobile, 'React Native', 2),
    (d_mobile, 'Conceitos de Android', 3),
    (d_mobile, 'Conceitos de iOS', 4);

  -- ── Ferramentas e Linguagens ────────────────────────────────────────────────
  INSERT INTO disciplinas (concurso_id, nome, ordem) VALUES (v_concurso, 'Ferramentas e Linguagens', 5) RETURNING id INTO d_ferramentas;
  INSERT INTO topicos (disciplina_id, texto, ordem) VALUES
    (d_ferramentas, 'Java (SE e EE)', 0),
    (d_ferramentas, 'Python para dados (Pandas, NumPy, SciPy, Matplotlib, Scikit-learn)', 1),
    (d_ferramentas, 'TypeScript', 2),
    (d_ferramentas, 'Ansible', 3);

  -- ── Língua Portuguesa ──────────────────────────────────────────────────────
  INSERT INTO disciplinas (concurso_id, nome, ordem) VALUES (v_concurso, 'Língua Portuguesa', 6) RETURNING id INTO d_port;
  INSERT INTO topicos (disciplina_id, texto, ordem) VALUES
    (d_port, 'Compreensão de textos', 0),
    (d_port, 'Ortografia oficial', 1),
    (d_port, 'Classe e emprego de palavras', 2),
    (d_port, 'Crase', 3),
    (d_port, 'Sintaxe da oração e do período', 4),
    (d_port, 'Pontuação', 5),
    (d_port, 'Concordância verbal e nominal', 6),
    (d_port, 'Regência verbal e nominal', 7),
    (d_port, 'Colocação pronominal', 8);

  -- ── Língua Inglesa ─────────────────────────────────────────────────────────
  INSERT INTO disciplinas (concurso_id, nome, ordem) VALUES (v_concurso, 'Língua Inglesa', 7) RETURNING id INTO d_ingles;
  INSERT INTO topicos (disciplina_id, texto, ordem) VALUES
    (d_ingles, 'Vocabulário fundamental', 0),
    (d_ingles, 'Aspectos gramaticais básicos', 1),
    (d_ingles, 'Compreensão de textos', 2);

  -- ── Matemática ────────────────────────────────────────────────────────────
  INSERT INTO disciplinas (concurso_id, nome, ordem) VALUES (v_concurso, 'Matemática', 8) RETURNING id INTO d_mat;
  INSERT INTO topicos (disciplina_id, texto, ordem) VALUES
    (d_mat, 'Conjuntos numéricos', 0),
    (d_mat, 'Razões e proporções', 1),
    (d_mat, 'Regra de três', 2),
    (d_mat, 'Porcentagem', 3),
    (d_mat, 'Lógica proposicional', 4),
    (d_mat, 'Funções', 5),
    (d_mat, 'Matrizes e determinantes', 6),
    (d_mat, 'Sistemas lineares', 7),
    (d_mat, 'Sequências, PA e PG', 8);

  -- ── Atualidades do Mercado Financeiro ──────────────────────────────────────
  INSERT INTO disciplinas (concurso_id, nome, ordem) VALUES (v_concurso, 'Atualidades do Mercado Financeiro', 9) RETURNING id INTO d_fin;
  INSERT INTO topicos (disciplina_id, texto, ordem) VALUES
    (d_fin, 'Bancos na era digital', 0),
    (d_fin, 'Internet, mobile e open banking', 1),
    (d_fin, 'Fintechs e big techs', 2),
    (d_fin, 'PIX e pagamentos instantâneos', 3),
    (d_fin, 'Blockchain e criptomoedas', 4),
    (d_fin, 'Transformação digital no SFN', 5);

END $$;
