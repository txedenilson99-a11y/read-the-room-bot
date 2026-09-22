import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { meuAcesso } from "./access.functions";

export function useAcesso(enabled: boolean) {
  const fn = useServerFn(meuAcesso);
  return useQuery({
    queryKey: ["meu-acesso"],
    queryFn: () => fn({}),
    enabled,
    staleTime: 30_000,
    retry: false,
  });
}
