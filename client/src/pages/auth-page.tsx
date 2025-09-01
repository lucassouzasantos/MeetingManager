import React, { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { insertUserSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Eye, EyeOff, Key, Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Email o usuario es obligatorio"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Confirme su contraseña"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const recoverySchema = z.object({
  email: z.string().email("Email inválido"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type RecoveryForm = z.infer<typeof recoverySchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const { toast } = useToast();

  // Redirect if already logged in - use useEffect to avoid setState during render
  React.useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      position: "",
      email: "",
    },
  });

  const recoveryForm = useForm<RecoveryForm>({
    resolver: zodResolver(recoverySchema),
    defaultValues: {
      email: "",
    },
  });

  const onLogin = async (data: LoginForm) => {
    try {
      await loginMutation.mutateAsync(data);
      setLocation("/");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const onRegister = async (data: RegisterForm) => {
    try {
      const { confirmPassword, ...registerData } = data;
      await registerMutation.mutateAsync(registerData);
      setLocation("/");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const recoveryMutation = useMutation({
    mutationFn: async (data: RecoveryForm) => {
      const res = await apiRequest("POST", "/api/forgot-password", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Recuperación enviada",
        description: data.message,
      });
      setRecoveryOpen(false);
      recoveryForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error en la recuperación",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onRecovery = async (data: RecoveryForm) => {
    await recoveryMutation.mutateAsync(data);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Forms */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
              <Calendar className="text-white h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sistema de Reservas</h1>
            <p className="text-gray-600">Gestione sus reservas de salas</p>
          </div>

          <Card>
            <CardContent className="p-0">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Ingresar</TabsTrigger>
                  <TabsTrigger value="register">Registrarse</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="p-6">
                  <CardHeader className="p-0 mb-6">
                    <CardTitle>Iniciar Sesión</CardTitle>
                    <CardDescription>
                      Ingrese sus credenciales para acceder al sistema
                    </CardDescription>
                  </CardHeader>

                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email o Usuario</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ingrese su email o usuario" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contraseña</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Ingrese su contraseña" 
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center justify-between">
                        <div></div>
                        <Dialog open={recoveryOpen} onOpenChange={setRecoveryOpen}>
                          <DialogTrigger asChild>
                            <Button variant="link" className="px-0 text-primary">
                              Olvidé mi contraseña
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5 text-warning" />
                                Recuperar Contraseña
                              </DialogTitle>
                              <DialogDescription>
                                Ingrese su email para recibir las instrucciones de recuperación
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...recoveryForm}>
                              <form onSubmit={recoveryForm.handleSubmit(onRecovery)} className="space-y-4">
                                <FormField
                                  control={recoveryForm.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Email</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="email"
                                          placeholder="Ingrese su email" 
                                          {...field} 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="flex gap-3">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => setRecoveryOpen(false)}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button 
                                    type="submit" 
                                    className="flex-1 bg-warning hover:bg-yellow-600"
                                    disabled={recoveryMutation.isPending}
                                  >
                                    {recoveryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Enviar
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Ingresar
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="register" className="p-6">
                  <CardHeader className="p-0 mb-6">
                    <CardTitle>Crear Cuenta</CardTitle>
                    <CardDescription>
                      Complete los datos para registrarse en el sistema
                    </CardDescription>
                  </CardHeader>

                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre Completo *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ingrese su nombre completo" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Función (Cargo) *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ej: Gerente de Ventas" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder="Ingrese su email" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre de Usuario *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ingrese un nombre de usuario" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contraseña *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Ingrese una contraseña fuerte" 
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground">
                              Mínimo 8 caracteres con letras y números
                            </p>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Contraseña *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="Ingrese la contraseña nuevamente" 
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full bg-secondary hover:bg-indigo-700"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Crear Cuenta
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      
    </div>
  );
}
