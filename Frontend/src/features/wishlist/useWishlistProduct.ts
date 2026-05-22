import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import type { RootState } from '@/app/store';
import {
  useAddToWishlistMutation,
  useGetWishlistQuery,
  useRemoveWishlistItemMutation,
} from './wishlistApiSlice';

export const useWishlistProduct = (productId: string | undefined) => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useSelector((state: RootState) => state.auth.token);

  const { data: wishlistData } = useGetWishlistQuery(
    { pageNumber: 1, pageSize: 100 },
    { skip: !token }
  );

  const [addToWishlist, { isLoading: isAdding }] = useAddToWishlistMutation();
  const [removeFromWishlist, { isLoading: isRemoving }] = useRemoveWishlistItemMutation();

  const wishlistItem = useMemo(
    () => wishlistData?.items?.find((item) => item.productId === productId),
    [wishlistData?.items, productId]
  );

  const isWishlisted = Boolean(wishlistItem);
  const isToggling = isAdding || isRemoving;

  const toggleWishlist = async () => {
    if (!productId) {
      return;
    }

    if (!token) {
      toast.error('Please login to save items to your wishlist');
      navigate('/login', { state: { redirectTo: location.pathname } });
      return;
    }

    try {
      if (isWishlisted && wishlistItem) {
        await removeFromWishlist(wishlistItem.wishListId).unwrap();
        toast.success('Removed from wishlist');
        return;
      }

      await addToWishlist(productId).unwrap();
      toast.success('Added to wishlist');
    } catch (error: unknown) {
      const apiError = error as { status?: number; data?: { message?: string } };
      if (apiError?.status === 401) {
        toast.error('Please login to save items to your wishlist');
        navigate('/login', { state: { redirectTo: location.pathname } });
        return;
      }
      toast.error(apiError?.data?.message || 'Could not update wishlist');
    }
  };

  return { isWishlisted, isToggling, toggleWishlist };
};
