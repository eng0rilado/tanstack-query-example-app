
## ¿Por qué usarlo?

No suple librerías como http o axios, las usa. Llama a una función que realiza peticiones y les da una key para luego controlar si se ha realizado la petición, se ha validado etc. La situación dónde brilla TanStack: En qué momento se hace la petición, si se resuelve exitosamente, si tenemos la data, manejar la caché, etc. Lo veremos más en detalle más adelante.


Vamos a ver con un ejemplo que nos puede ofrecer. Vamos a desarrollar una app en react sencilla que haga una consulta http a un servicio que nos da un número aleatorio. Cuando pulsamos el botón de nuevo número, se vuelve a obtener otro número aleatorio.

![[Pasted image 20250601114640.png]]


```jsx
import { useEffect, useState } from 'react'
import './App.css'

function App() {

  // https://www.random.org/integers/?num=1&min=1&max=500&col=1&base=10&format=plain&rnd=new

  const [number, setNumber] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();  
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {

    setIsLoading(true);
    
    fetch('https://www.random.org/integers/?num=1&min=1&max=500&col=1&base=10&format=plain&rnd=new')
      .then( resp => resp.json())
      .then( data => {
        setNumber(data);
        setIsLoading(false);
      } )
      .catch( error => setError(error))
      .finally( () => setIsLoading(false))
  
  }, [refreshToken])
  

  return (
    <>
    {
      isLoading ? <h1>Cargando</h1> : <h1>Número: {number}</h1>
    }

    <div>{error}</div>
    
    <button
      disabled={isLoading} 
      onClick={ () => setRefreshToken (refreshToken + 1) }>Nuevo número</button>

    </>
  )
}

export default App

```


Se puede observar que el código de obtención del número aleatorio a través de la API es un poco tocho. Además, si quisiéramos volver a realizar esta llamada desde otro componente necesitaríamos volver a copiar todo el código (podríamos solucionarlo con una función o customHook). Pero además, qué pasa si queremos mostrar el valor de la última llamada, porque la petición ya se realizó una vez? Aquí, y para este tipo de cosas, entra en juego TanStack.


https://tanstack.com/query/v5
https://tanstack.com/query/latest/docs/framework/react/installation

Instalamos, en este caso mediante NPM:

react-query
```bash
npm i @tanstack/react-query
```

Eslint Plugin Query

```bash
npm i -D @tanstack/eslint-plugin-query
```

DevTools

```bash
npm i @tanstack/react-query-devtools
```


 Aquí vemos un ejemplo funcion al de cómo funcion TanStack

```tsx
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { getTodos, postTodo } from '../my-api'

// Create a client
const queryClient = new QueryClient()

function App() {
  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
      <Todos />
    </QueryClientProvider>
  )
}

function Todos() {
  // Access the client
  const queryClient = useQueryClient()

  // Queries
  const query = useQuery({ queryKey: ['todos'], queryFn: getTodos })

  // Mutations
  const mutation = useMutation({
    mutationFn: postTodo,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  return (
    <div>
      <ul>{query.data?.map((todo) => <li key={todo.id}>{todo.title}</li>)}</ul>

      <button
        onClick={() => {
          mutation.mutate({
            id: Date.now(),
            title: 'Do Laundry',
          })
        }}
      >
        Add Todo
      </button>
    </div>
  )
}

render(<App />, document.getElementById('root'))```


Vamos a construir el main.tsx

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'


const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools />
    </QueryClientProvider>
  </StrictMode>,
)
```


Aquí vemos las devTools:

![[Pasted image 20250601122343.png]]


Los queries son cualquier promesa.

Ahora vamos a ver cómo TanStack Query nos ayuda para hacer el mismo ejercicio de antes.

```tsx
import './App.css'
import { useQuery } from '@tanstack/react-query';
import { RandomNumber } from './components/RandomNumber';

const getCryptoNumber = async (): Promise<number> => {
  
  const resp = await fetch('https://www.random.org/integers/?num=1&min=1&max=500&col=1&base=10&format=plain&rnd=new');
  const responseData = await resp.json();
  return Number(responseData);
  
}

function App() {

  const {isLoading, isFetching, data:number, error, refetch} = useQuery({
    queryKey: ['randomNumber'],
    queryFn: getCryptoNumber, // () => getCryptoNumber()
    staleTime: 1000 * 5 //5 segundos de data que no se va a refrescar hasta pasada esa hora aunque se vuelva a llamar al método. Si haces refetch lo hace igualmente, es solo para situaciones en las que se rerenderice el componente por un cambio de estado ajeno al número
  })

  return (
    <>
      {
        isFetching ? <h1>Cargando</h1> : <h1>Número: {number}</h1>
      }

      <RandomNumber />

      <div>{JSON.stringify(error)}</div>

      { <button
        disabled={isLoading}
        onClick={() => refetch()}>Nuevo número
      </button> }

    </>
  )
}

export default App
```



StaleTime:

- Durante esos **5 segundos**, **React Query considera los datos como “frescos”**.
- Si hay un **re-render** por cualquier motivo (cambio de estado, navegación, reenfoque de ventana, etc.), **NO volverá a hacer la petición** automáticamente durante ese tiempo.
- **PERO** si tú llamas a refetch() manualmente (como haces con el botón), **sí hace la petición, independientemente del staleTime**.



RandomNumber.tsx

```jsx
import { useQuery } from "@tanstack/react-query"

const getCryptoNumber = async (): Promise<number> => {

    const resp = await fetch('https://www.random.org/integers/?num=1&min=1&max=500&col=1&base=10&format=plain&rnd=new');
    const responseData = await resp.json();
    return Number(responseData);

}

export const RandomNumber = () => {

    const { data } = useQuery({
        queryKey: ['randomNumber'],
        queryFn: getCryptoNumber, // () => getCryptoNumber()
        staleTime: 1000 * 5 //5 segundos de data que n o se va a refrescar hasta pasada esa hora aunque se vuelva a llamar al método.
    })


    return (
        <div>Random Number: {data}</div>
    )
}
```


![[Pasted image 20250601131353.png]]


Creamos el RandomNumber.tsx para mostrar lo mismo (el data) 2 veces en distintos componentes. Lo realmente potente de TanStack es que, al hacer la llamada a la API, cuando el valor devuelto cambie, cambiará en todos los componentes (comportamiento por defecto).

- Cuando haces una petición en App.tsx con queryKey: ['randomNumber'], TanStack guarda en **su caché** ese resultado.
- Luego, si **otro componente usa la misma queryKey**, **no se vuelve a hacer la petición**, simplemente **recoge el dato de la caché**.
- **Si el dato cambia (por ejemplo, tras un refetch()), todos los componentes que lo usan se actualizan automáticamente.**



Cuando Vamos a otra aplicación o vamos a otro escritorio, y luego volvemos otra vez a visualizar la app que estamos creando, se vuelve a hacer la petición de obtención de número aleatorio de forma autmática. Esto es porque TanStack hace porque el usuario vea los datos "frescos". Este funcionamiento puede que no sea el deseado en muchas ocasiones. Esto lo solucionamos fácil con la siguiente propiedad de objeto

```json
refetchOnWindowFocus: false
```


Comentamos la llamada al componente de prueba que hemos explicado antes para mostrar el funcionamiento de mantener todos los componentes con el mismo valor (RandomNumber.tsx) y mostramos ejemplo


```tsx
import './App.css'
import { useQuery } from '@tanstack/react-query';
import { RandomNumber } from './components/RandomNumber';

const getCryptoNumber = async (): Promise<number> => {
  
  const resp = await fetch('https://www.random.org/integers/?num=1&min=1&max=500&col=1&base=10&format=plain&rnd=new');
  const responseData = await resp.json();
  return Number(responseData);
  
}

function App() {

  const {isLoading, isFetching, data:number, error, refetch} = useQuery({
    refetchOnWindowFocus: false,
    queryKey: ['randomNumber'],
    queryFn: getCryptoNumber, // () => getCryptoNumber()
    staleTime: 1000 * 5 //5 segundos de data que n o se va a refrescar hasta pasada esa hora aunque se vuelva a llamar al método.
  })

  return (
    <>
      {
        isFetching ? <h1>Cargando</h1> : <h1>Número: {number}</h1>
      }
      {/* <RandomNumber /> */}
      <div>{JSON.stringify(error)}</div>
      { <button
        disabled={isLoading}
        onClick={() => refetch()}>Nuevo número
      </button> }
    </>
  )
}

export default App
```


También podemos añadir propiedades por defecto, para todas las peticiones que se hagan, en TanStack:

main.tsx

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'


const queryClient = new QueryClient({
  defaultOptions:{
    queries:{
      refetchOnWindowFocus: false
    }
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools />
    </QueryClientProvider>
  </StrictMode>,
)
```


Ahora vamos a gestionar los errores. Si dejamos la configuración tal y cómo está, y forzamos al método a lanzar un error siempre. TanStack por defecto va a lanzar una serie de reintentos. En nuestro caso no queremos reintentos:

```tsx
import './App.css'
import { useQuery } from '@tanstack/react-query';
import { RandomNumber } from './components/RandomNumber';

const getCryptoNumber = async (): Promise<number> => {
	throw 'No se pudo obtener el número';
}

function App() {

  const {isLoading, isFetching, data:number, error, refetch} = useQuery({
    // refetchOnWindowFocus: false,
    retry: false, //NO REINTENTOS
    // retryDelay: 5000
    queryKey: ['randomNumber'],
    queryFn: getCryptoNumber, // () => getCryptoNumber()
    staleTime: 1000 * 5 //5 segundos de data que n o se va a refrescar hasta pasada esa hora aunque se vuelva a llamar al método.
  })

  return (
    ...
  )
}

export default App
```



Vamos a crear un CustomHook para hacer todo esto:


App.tsx

```tsx
import './App.css'
import { useRandom } from './hooks/useRandom';

function App() {

  const { randomQuery } = useRandom();

  return (
    <>
      {
        randomQuery.isFetching ? <h1>Cargando</h1> : <h1>Número: {randomQuery.data}</h1>
      }


      {/* <RandomNumber /> */}

      <div>{JSON.stringify(randomQuery.error)}</div>

      {<button
        disabled={randomQuery.isLoading}
        onClick={() => randomQuery.refetch()}>Nuevo número
      </button>}

    </>
  )
}

export default App
```


useRandom.tsx

```tsx
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

}```
