import { test } from "node:test";
import assert from "node:assert/strict";
import { storyResultSchema, validateStoryInput } from "./psicologia-story.validation";

const valid = () => ({
  detalhes_observaveis: ["Pergunta café ou chá?"],
  interpretacoes: [],
  nao_da_pra_concluir: ["Não dá para inferir interesse romântico."],
  estrategia: "Responder à pergunta, sem insistir.",
  respostas: [
    {
      tom: "natural",
      texto: "café, sem dúvida",
      detalhe_indice: 0,
      por_que: "Escolhe café na pergunta visível.",
    },
    {
      tom: "engracado",
      texto: "café, meu despertador líquido",
      detalhe_indice: 0,
      por_que: "Brinca com a opção café.",
    },
    {
      tom: "curioso",
      texto: "chá gelado conta?",
      detalhe_indice: 0,
      por_que: "Pergunta sobre a opção chá.",
    },
    {
      tom: "confiante",
      texto: "time café por aqui",
      detalhe_indice: 0,
      por_que: "Responde diretamente à escolha visível.",
    },
  ],
  melhor_resposta: { texto: "café, sem dúvida", por_que: "Responde à pergunta visível." },
});

test("exatamente quatro sugestões, nunca três ou cinco", () => {
  assert.equal(storyResultSchema.safeParse(valid()).success, true);
  const three = valid();
  three.respostas.pop();
  assert.equal(storyResultSchema.safeParse(three).success, false);
  const five = valid();
  const first = five.respostas[0];
  if (first) five.respostas.push(first);
  assert.equal(storyResultSchema.safeParse(five).success, false);
});
test("quatro tons distintos", () => {
  const data = valid();
  const second = data.respostas[1];
  if (second) second.tom = "natural";
  assert.equal(storyResultSchema.safeParse(data).success, false);
});
test("explicação e vínculo a fato são obrigatórios", () => {
  const data = valid();
  const first = data.respostas[0];
  if (first) first.por_que = "";
  assert.equal(storyResultSchema.safeParse(data).success, false);
  if (first) {
    first.por_que = "Explicação";
    first.detalhe_indice = 1;
  }
  assert.equal(storyResultSchema.safeParse(data).success, false);
});
test("não aceita mensagens duplicadas", () => {
  const data = valid();
  const second = data.respostas[1];
  if (second) second.texto = "Café, sem dúvida!";
  assert.equal(storyResultSchema.safeParse(data).success, false);
});
test("bloqueia emoção presumida e elogio vazio", () => {
  for (const value of ["tá na bad?", "quem te magoou?", "linda", "vai passar", "que legal"]) {
    const data = valid();
    const first = data.respostas[0];
    if (first) first.texto = value;
    assert.equal(storyResultSchema.safeParse(data).success, false, value);
  }
});
test("limite de doze palavras", () => {
  const data = valid();
  const first = data.respostas[0];
  if (first) first.texto = Array.from({ length: 13 }, (_, i) => `palavra${i}`).join(" ");
  assert.equal(storyResultSchema.safeParse(data).success, false);
});
test("melhor resposta deve ser uma das quatro", () => {
  const data = valid();
  data.melhor_resposta.texto = "outra mensagem";
  assert.equal(storyResultSchema.safeParse(data).success, false);
});
test("upload rejeita tipo inválido, arquivo disfarçado e mais de 6 MB", () => {
  assert.throws(() => validateStoryInput({ image: "data:image/webp;base64,AAAA" }));
  assert.throws(() => validateStoryInput({ image: "data:image/png;base64,AAAA" }));
  assert.throws(
    () => validateStoryInput({ image: `data:image/png;base64,${"A".repeat(8_000_004)}` }),
    /6 MB/,
  );
});
test("preserva imagem e contexto na regeneração", () => {
  const image = "data:image/png;base64,iVBORw0KGgo=";
  const data = validateStoryInput({
    image,
    contexto: " já conversamos ",
    anteriores: ["café, sem dúvida"],
  });
  assert.equal(data.image, image);
  assert.equal(data.contexto, "já conversamos");
  assert.deepEqual(data.anteriores, ["café, sem dúvida"]);
});
