import { useQuery } from "@tanstack/react-query";

const getCryptoNumber = async (): Promise<number> => {
  
  const resp = await fetch('https://www.random.org/integers/?num=1&min=1&max=500&col=1&base=10&format=plain&rnd=new');
  const responseData = await resp.json();
  return Number(responseData);
  
}

export const useRandom = () => {

const randomQuery = useQuery({
    // refetchOnWindowFocus: false,
    retry: false,
    // retryDelay: 5000
    queryKey: ['randomNumber'],
    queryFn: getCryptoNumber, // () => getCryptoNumber()
    staleTime: 1000 * 5 //5 segundos de data que n o se va a refrescar hasta pasada esa hora aunque se vuelva a llamar al método.
  })

  return {
    randomQuery
  }

}
