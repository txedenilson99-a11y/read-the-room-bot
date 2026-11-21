// @ts-expect-error bun:test types are not installed; run with `bun test`
import { describe, expect, test } from "bun:test";
import {
  filtrarMensagens,
  motivoReprovacao,
  diagnosticoRuim,
  ehPaisagem,
} from "./arte-atracao.validacao";

const m = (texto: string) => ({ tom: "x", texto, por_que: "x" });

describe("Arte da Atração — validação", () => {
  test("bloqueia as 4 mensagens reprovadas da cachoeira", () => {
    for (const t of [
      "Lugar incrível esse! Você pegou um dia bom por aí?",
      "Dizem que a vista de lá de cima é surreal, vale a subida mesmo?",
      "O barulho dessa queda d'água deve ser surreal de perto.",
      "Caracol é um clássico! O tempo tá ajudando no passeio?",
    ])
      expect(motivoReprovacao(t, "", true)).not.toBeNull();
  });
  test("aprova perguntas simples ancoradas no visível", () => {
    expect(motivoReprovacao("Onde fica essa cachoeira?", "", true)).toBeNull();
    expect(motivoReprovacao("Que lugar é esse?", "", true)).toBeNull();
  });
  test("nome do lugar só passa se estiver no contexto", () => {
    expect(motivoReprovacao("O Caracol tava cheio?", "", true)).not.toBeNull();
    expect(motivoReprovacao("Caracol de novo?", "ela foi na cascata do caracol", true)).toBeNull();
  });
  test("em paisagem mantém no máximo 1 pergunta", () => {
    const r = filtrarMensagens([m("Onde fica essa cachoeira?"), m("Que lugar é esse?")], "", true);
    expect(r.aprovadas.length).toBe(1);
  });
  test("diagnóstico que fala de viagem ou paisagem icônica é reprovado", () => {
    expect(
      diagnosticoRuim("Paisagem icônica, lugar comum para iniciar conversa sobre viagens.", ""),
    ).toBe(true);
  });
  test("detecta paisagem", () => {
    expect(ehPaisagem("foto de uma cachoeira")).toBe(true);
  });
});
