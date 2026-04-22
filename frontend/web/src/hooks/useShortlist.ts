"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getUserShortlist,
  me,
  postShortlistProperty,
  removeShortlistProperty,
} from "@/data/ClientData";
import {
  addLocalShortlist,
  isLocalShortlisted,
  removeLocalShortlist,
} from "@/utilies/shortlistLocal";

type ShortlistPropertyType =
  | "Residential"
  | "Commercial"
  | "Land"
  | "Agricultural"
  | "FeaturedProject";

type ShortlistEntry = {
  property?: {
    _id?: string;
  };
};

export function useShortlist(
  propertyId?: string,
  propertyType?: ShortlistPropertyType,
) {
  const [isShortlisted, setIsShortlisted] = useState(false);
  const queryClient = useQueryClient();

  const { data: userData } = useQuery({
    queryKey: ["user"],
    queryFn: me,
    retry: 1,
  });

  const user = userData?.user;

  const { data: shortlistData } = useQuery({
    queryKey: ["user-shortlist"],
    queryFn: getUserShortlist,
    enabled: !!user && !!propertyId,
  });

  useEffect(() => {
    if (!propertyId) {
      setIsShortlisted(false);
      return;
    }

    if (user && shortlistData?.data) {
      const isInList = shortlistData.data.some(
        (item: ShortlistEntry) => item.property?._id === propertyId,
      );
      setIsShortlisted(isInList);
      return;
    }

    setIsShortlisted(isLocalShortlisted(propertyId));
  }, [propertyId, shortlistData, user]);

  const addShortlistMutation = useMutation({
    mutationFn: postShortlistProperty,
    onSuccess: () => {
      toast.success("Added to shortlist");
    },
    onMutate: async () => {
      if (!propertyId) return {};

      await queryClient.cancelQueries({ queryKey: ["user-shortlist"] });
      const previousShortlist = queryClient.getQueryData(["user-shortlist"]);

      queryClient.setQueryData(["user-shortlist"], (old: any) => {
        const oldData = old?.data || [];
        const alreadyExists = oldData.some(
          (item: ShortlistEntry) => item.property?._id === propertyId,
        );

        if (alreadyExists) return old;

        return {
          ...old,
          data: [...oldData, { property: { _id: propertyId } }],
        };
      });

      return { previousShortlist };
    },
    onError: (_err, _variables, context: any) => {
      if (context?.previousShortlist) {
        queryClient.setQueryData(["user-shortlist"], context.previousShortlist);
      }
      toast.error("Failed to add to shortlist.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user-shortlist"] });
    },
  });

  const removeShortlistMutation = useMutation({
    mutationFn: removeShortlistProperty,
    onSuccess: () => {
      toast.success("Removed from shortlist");
    },
    onMutate: async (targetPropertyId: string) => {
      await queryClient.cancelQueries({ queryKey: ["user-shortlist"] });
      const previousShortlist = queryClient.getQueryData(["user-shortlist"]);

      queryClient.setQueryData(["user-shortlist"], (old: any) => ({
        ...old,
        data: (old?.data || []).filter(
          (item: ShortlistEntry) => item.property?._id !== targetPropertyId,
        ),
      }));

      return { previousShortlist };
    },
    onError: (_err, _variables, context: any) => {
      if (context?.previousShortlist) {
        queryClient.setQueryData(["user-shortlist"], context.previousShortlist);
      }
      toast.error("Failed to remove from shortlist.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user-shortlist"] });
    },
  });

  const toggleShortlist = () => {
    if (!propertyId || !propertyType) {
      toast.error("Unable to shortlist this project.");
      return;
    }

    if (user) {
      if (isShortlisted) {
        setIsShortlisted(false);
        removeShortlistMutation.mutate(propertyId);
        return;
      }

      setIsShortlisted(true);
      addShortlistMutation.mutate({ propertyId, propertyType });
      return;
    }

    if (isShortlisted) {
      removeLocalShortlist(propertyId);
      setIsShortlisted(false);
      toast.success("Removed from shortlist");
      return;
    }

    addLocalShortlist(propertyId, propertyType);
    setIsShortlisted(true);
    toast.success("Added to shortlist");
  };

  return {
    isShortlisted,
    isShortlistLoading:
      addShortlistMutation.isPending || removeShortlistMutation.isPending,
    toggleShortlist,
  };
}
