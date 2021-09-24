import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get<Stock>(`/stock/${productId}`);

      const product = cart.find(product => product.id === productId);

      if (product) {
        if (product.amount < response.data.amount) {

          updateProductAmount({ productId: productId, amount: product.amount + 1 });

        }
        else {

          toast.error('Quantidade solicitada fora de estoque');

        }

      } else {

        const response = await api.get<Product>(`/products/${productId}`);
        setCart([...cart, { ...response.data, amount: 1 }]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));

      }



      // console.log(response.data);
    } catch {
      toast.error('Erro na adição do produto');
    }
  };



  const removeProduct = (productId: number) => {
    try {
      let product: Product[];
      product = cart.filter((item) => item.id !== productId);
      setCart(product);
  
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const response = await api.get<Stock>(`/stock/${productId}`);
      const product = cart.find(product => product.id === productId);

      if (product && response) {
        if (product.amount < response.data.amount) {
          let list: Product[];
          list = cart.map(product => { return product.id === productId ? { ...product, amount: amount } : product });
          setCart(list);

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(list));
        

        }
        else {

          toast.error('Quantidade solicitada fora de estoque');

        }
      }


    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
