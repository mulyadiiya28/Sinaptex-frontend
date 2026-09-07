import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "./profile.api";
import { UpdateProfileInput } from "./profile.schema";
import { useSessionStore } from "@/store/use-session-store";
import { authKeys } from "@/features/auth/auth.hooks";

const profileKeys = { detail: ["profile"] as const };

export function useProfile() {
  const setMe = useSessionStore((s) => s.setMe);

  return useQuery({
    queryKey: profileKeys.detail,
    queryFn: async () => {
      const profile = await profileApi.get();
      // Sinkron ke session store agar header/dashboard menampilkan data server
      if (profile && typeof profile === "object" && "id" in profile) {
        setMe(profile as never);
      }
      return profile;
    },
    retry: 1,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setMe = useSessionStore((s) => s.setMe);

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => profileApi.update(input),
    onSuccess: (data) => {
      setMe(data as never);
      queryClient.setQueryData(profileKeys.detail, data);
      queryClient.setQueryData(authKeys.me, data);
      queryClient.invalidateQueries({ queryKey: profileKeys.detail });
    },
  });
}
