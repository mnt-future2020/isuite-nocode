"use client";

import { CredentialType } from "@/generated/prisma";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCreateCredential,
  useUpdateCredential,
  useSuspenseCredential,
} from "../hooks/use-credentials";
import { useUpgradeModal } from "@/hooks/use-upgrade-modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { exchangeGoogleToken } from "../actions/oauth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(CredentialType),
  value: z.string().min(1, "Value is required"),
});

type FormValues = z.infer<typeof formSchema>;

const credentialTypeOptions = [
  {
    value: CredentialType.OPENAI,
    label: "OpenAI",
    logo: "/logos/openai.svg",
  },
  {
    value: CredentialType.ANTHROPIC,
    label: "Anthropic",
    logo: "/logos/anthropic.svg",
  },
  {
    value: CredentialType.GEMINI,
    label: "Gemini",
    logo: "/logos/gemini.svg",
  },
  {
    value: CredentialType.GOOGLE_SHEETS,
    label: "Google Sheets",
    logo: "/logos/google-sheets.png",
  },
  {
    value: CredentialType.POSTGRES,
    label: "Postgres",
    logo: "/logos/postgres.png",
  },
  {
    value: CredentialType.MYSQL,
    label: "MySQL",
    logo: "/logos/mysql.png",
  },
  {
    value: CredentialType.GMAIL,
    label: "Gmail (OAuth)",
    logo: "/logos/google.svg",
  },
  {
    value: CredentialType.GOOGLE_FORMS,
    label: "Google Forms",
    logo: "/logos/googleform.svg",
  },
  {
    value: CredentialType.WHATSAPP,
    label: "WhatsApp Cloud API",
    logo: "/logos/whatsapp.svg",
  },
];

interface CredentialFormProps {
  initialData?: {
    id?: string;
    name: string;
    type: CredentialType;
    value: string;
  };
};

export const CredentialForm = ({
  initialData,
}: CredentialFormProps) => {
  const router = useRouter();
  const createCredential = useCreateCredential();
  const updateCredential = useUpdateCredential();
  const { handleError, modal } = useUpgradeModal();

  const isEdit = !!initialData?.id;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      type: CredentialType.OPENAI,
      value: "",
    },
  });

  const watchType = form.watch("type");

  // Gmail specific state
  const [gmailConfig, setGmailConfig] = useState(() => {
    if (initialData?.value && (
      initialData.type === CredentialType.GMAIL ||
      initialData.type === CredentialType.GOOGLE_SHEETS ||
      initialData.type === CredentialType.GOOGLE_FORMS
    )) {
      try {
        // Only attempt parse if it looks like a JSON object to avoid syntax errors
        if (initialData.value.trim().startsWith('{')) {
          return JSON.parse(initialData.value);
        }
      } catch (e) {
        // Silent fallback to default if parse fails
      }
    }
    return {
      user: "",
      clientId: "",
      clientSecret: "",
      refreshToken: "",
    };
  });

  // WhatsApp specific state
  const [whatsappConfig, setWhatsappConfig] = useState(() => {
    if (initialData?.value && initialData.type === CredentialType.WHATSAPP) {
      try {
        if (initialData.value.trim().startsWith('{')) {
          return JSON.parse(initialData.value);
        }
      } catch (e) {
        // Silent fallback
      }
    }
    return {
      accessToken: "",
      phoneNumberId: "",
      verifyToken: "",
    };
  });

  // OAuth Flow State
  const [redirectUri, setRedirectUri] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRedirectUri(`${window.location.origin}/oauth/callback`);
    }
  }, []);

  // Sync state to form value when config changes
  useEffect(() => {
    if (watchType === CredentialType.GMAIL || watchType === CredentialType.GOOGLE_SHEETS || watchType === CredentialType.GOOGLE_FORMS) {
      const newValue = JSON.stringify(gmailConfig);
      if (form.getValues("value") !== newValue) {
        form.setValue("value", newValue);
      }
    } else if (watchType === CredentialType.WHATSAPP) {
      const newValue = JSON.stringify(whatsappConfig);
      if (form.getValues("value") !== newValue) {
        form.setValue("value", newValue);
      }
    }
  }, [gmailConfig, whatsappConfig, watchType, form]);

  // Sync from initialData changes (e.g. after save/redirect)
  useEffect(() => {
    if (!initialData) return;

    // Reset form to match latest server data
    form.reset(initialData);

    // Sync local state for Gmail/Sheets/Forms
    if (
      initialData.type === CredentialType.GMAIL ||
      initialData.type === CredentialType.GOOGLE_SHEETS ||
      initialData.type === CredentialType.GOOGLE_FORMS
    ) {
      try {
        if (initialData.value && initialData.value.trim().startsWith('{')) {
          let parsed = JSON.parse(initialData.value);
          // Handle potential double-encoding
          if (typeof parsed === 'string') {
            try {
              const inner = JSON.parse(parsed);
              if (typeof inner === 'object' && inner !== null) parsed = inner;
            } catch (e) { /* ignore */ }
          }

          if (typeof parsed === 'object' && parsed !== null) {
            setGmailConfig(parsed);
          }
        }
      } catch (e) {
        // ignore
      }
    }

    // Sync local state for WhatsApp
    if (initialData.type === CredentialType.WHATSAPP) {
      try {
        if (initialData.value && initialData.value.trim().startsWith('{')) {
          let parsed = JSON.parse(initialData.value);
          // Handle double-encoding
          if (typeof parsed === 'string') {
            try {
              const inner = JSON.parse(parsed);
              if (typeof inner === 'object' && inner !== null) parsed = inner;
            } catch (e) { /* ignore */ }
          }

          if (typeof parsed === 'object' && parsed !== null) {
            setWhatsappConfig(parsed);
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }, [initialData, form]);

  const handleOAuthLogin = useCallback(() => {
    if (!gmailConfig.clientId || !gmailConfig.clientSecret) {
      toast.error("Please enter Client ID and Client Secret first");
      return;
    }

    setIsConnecting(true);

    // Define clean up function locally to remove listener later
    const receiveMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "OAUTH_RESPONSE") {
        const { code, error } = event.data;

        if (error) {
          toast.error(`OAuth Error: ${error}`);
          setIsConnecting(false);
          window.removeEventListener("message", receiveMessage);
          return;
        }

        if (code) {
          try {
            toast.info("Exchanging code for tokens...");
            const result = await exchangeGoogleToken({
              code,
              clientId: gmailConfig.clientId,
              clientSecret: gmailConfig.clientSecret,
              redirectUri,
            });

            if (result.refresh_token) {
              setGmailConfig((prev: any) => ({
                ...prev,
                refreshToken: result.refresh_token,
                user: result.email || prev.user,
              }));
              const typeLabel = watchType === CredentialType.GOOGLE_SHEETS ? 'Google Sheets' :
                watchType === CredentialType.GOOGLE_FORMS ? 'Google Forms' : 'Gmail';
              toast.success(`Successfully connected to ${typeLabel}!`);
            } else {
              toast.warning("Connected, but no refresh token returned. Revoke access and try again if this persists.");
            }
          } catch (err) {
            toast.error(`Token Exchange Failed: ${err instanceof Error ? err.message : String(err)}`);
          } finally {
            setIsConnecting(false);
            window.removeEventListener("message", receiveMessage);
          }
        }
      }
    };

    window.addEventListener("message", receiveMessage);

    // Determine Scope
    let scope = "https://mail.google.com/ email profile";
    if (watchType === CredentialType.GOOGLE_SHEETS) {
      scope = "https://www.googleapis.com/auth/spreadsheets email profile";
    } else if (watchType === CredentialType.GOOGLE_FORMS) {
      scope = "https://www.googleapis.com/auth/forms.body.readonly https://www.googleapis.com/auth/forms.responses.readonly email profile";
    }

    // Construct Auth URL
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.append("client_id", gmailConfig.clientId);
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("scope", scope);
    authUrl.searchParams.append("access_type", "offline");
    authUrl.searchParams.append("prompt", "consent"); // Force consent to ensure refresh token

    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      authUrl.toString(),
      "GoogleAuth",
      `width=${width},height=${height},top=${top},left=${left}`
    );

  }, [gmailConfig.clientId, gmailConfig.clientSecret, redirectUri, watchType]);


  const onSubmit = async (values: FormValues) => {
    // Ensure value is strictly synced with the active config state
    // This prevents race conditions where useEffect hasn't fired yet to update the form value
    let payloadValue = values.value;

    if (values.type === CredentialType.GMAIL || values.type === CredentialType.GOOGLE_SHEETS || values.type === CredentialType.GOOGLE_FORMS) {
      payloadValue = JSON.stringify(gmailConfig);
    } else if (values.type === CredentialType.WHATSAPP) {
      payloadValue = JSON.stringify(whatsappConfig);
    }

    const payload = {
      ...values,
      value: payloadValue
    };

    if (isEdit && initialData?.id) {
      await updateCredential.mutateAsync({
        id: initialData.id,
        ...payload,
      })
    } else {
      await createCredential.mutateAsync(payload, {
        onSuccess: (data) => {
          router.push(`/credentials/${data.id}`);
        },
        onError: (error) => {
          handleError(error);
        }
      })
    }
  }

  return (
    <>
      {modal}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>
            {isEdit ? "Edit Credential" : "Create Credential"}
          </CardTitle>
          <CardDescription>
            {isEdit
              ? "Update your API key or credential details"
              : "Add a new API key or credential to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Credential" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {credentialTypeOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                          >
                            <div className="flex items-center gap-2">
                              <Image
                                src={option.logo}
                                alt={option.label}
                                width={16}
                                height={16}
                              />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchType === CredentialType.GMAIL || watchType === CredentialType.GOOGLE_SHEETS || watchType === CredentialType.GOOGLE_FORMS ? (
                <div className="space-y-4 border p-4 rounded-md bg-muted/20">
                  <div className="space-y-2">
                    <FormLabel>OAuth Redirect URL</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={redirectUri}
                        className="bg-muted text-muted-foreground"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(redirectUri);
                          toast.success("Copied to clipboard");
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Copy this URL and add it to "Authorized redirect URIs" in your Google Cloud Console.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <FormLabel>Client ID <span className="text-red-500">*</span></FormLabel>
                    <Input
                      value={gmailConfig.clientId}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGmailConfig((prev: any) => ({ ...prev, clientId: e.target.value }))}
                      placeholder="...apps.googleusercontent.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <FormLabel>Client Secret <span className="text-red-500">*</span></FormLabel>
                    <Input
                      type="password"
                      value={gmailConfig.clientSecret}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGmailConfig((prev: any) => ({ ...prev, clientSecret: e.target.value }))}
                      placeholder="Client Secret"
                    />
                  </div>

                  <div className="pt-2">
                    {gmailConfig.refreshToken ? (
                      <div className="p-3 border border-green-200 bg-green-50 rounded-md flex items-center gap-2 text-green-700">
                        <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
                        <span className="text-sm font-medium">Connected as {gmailConfig.user}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-auto text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setGmailConfig((prev: any) => ({ ...prev, refreshToken: "", user: "" }))}
                        >
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={handleOAuthLogin}
                        disabled={isConnecting || !gmailConfig.clientId || !gmailConfig.clientSecret}
                      >
                        {isConnecting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            {watchType === CredentialType.GOOGLE_SHEETS ? (
                              <Image src="/logos/google-sheets.png" width={16} height={16} alt="Sheets" />
                            ) : watchType === CredentialType.GOOGLE_FORMS ? (
                              <Image src="/logos/googleform.svg" width={16} height={16} alt="Forms" />
                            ) : (
                              <Image src="/logos/google.svg" width={16} height={16} alt="Google" />
                            )}
                            {watchType === CredentialType.GOOGLE_SHEETS ? "Sign in with Google Sheets" :
                              watchType === CredentialType.GOOGLE_FORMS ? "Sign in with Google Forms" : "Sign in with Google"}
                          </>
                        )}
                      </Button>
                    )}
                    {!gmailConfig.refreshToken && (
                      <p className="text-[11px] text-center text-muted-foreground mt-2">
                        Click to open popup and authorize access.
                      </p>
                    )}
                  </div>

                  {/* Hidden Refresh Token Field (stored in state, but debug view if needed) */}
                  {gmailConfig.refreshToken && (
                    <div className="space-y-2 opacity-50">
                      <FormLabel className="text-xs">Refresh Token (Auto-filled)</FormLabel>
                      <Input
                        type="password"
                        readOnly
                        value={gmailConfig.refreshToken}
                        className="text-xs h-8"
                      />
                    </div>
                  )}
                </div>
              ) : watchType === CredentialType.WHATSAPP ? (
                <div className="space-y-4 border p-4 rounded-md bg-muted/20">
                  <div className="space-y-2">
                    <FormLabel>Access Token (System User) <span className="text-red-500">*</span></FormLabel>
                    <Input
                      type="password"
                      placeholder="EA..."
                      value={whatsappConfig.accessToken}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWhatsappConfig((prev: any) => ({ ...prev, accessToken: e.target.value }))}
                    />
                    <p className="text-[11px] text-muted-foreground">Permanent access token from Meta Business Suite.</p>
                  </div>
                  <div className="space-y-2">
                    <FormLabel>Phone Number ID <span className="text-red-500">*</span></FormLabel>
                    <Input
                      placeholder="1234567890"
                      value={whatsappConfig.phoneNumberId}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWhatsappConfig((prev: any) => ({ ...prev, phoneNumberId: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <FormLabel>Verify Token <span className="text-red-500">*</span></FormLabel>
                    <Input
                      placeholder="my-secret-token"
                      value={whatsappConfig.verifyToken}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWhatsappConfig((prev: any) => ({ ...prev, verifyToken: e.target.value }))}
                    />
                    <p className="text-[11px] text-muted-foreground">Create a secure string. You will use this when setting up the Webhook in Meta.</p>
                  </div>
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key / Value</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={
                            watchType === CredentialType.POSTGRES || watchType === CredentialType.MYSQL ? "Connection String" :
                              "sk-..."
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={
                    createCredential.isPending ||
                    updateCredential.isPending
                  }
                >
                  {isEdit ? "Update" : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  asChild
                >
                  <Link href="/credentials" prefetch>
                    Cancel
                  </Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  )
};

export const CredentialView = ({
  credentialId,
}: { credentialId: string }) => {
  const { data: credential } = useSuspenseCredential(credentialId);

  return <CredentialForm initialData={credential} />
};
