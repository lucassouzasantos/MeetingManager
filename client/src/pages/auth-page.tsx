import React, { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Eye, EyeOff, Key, Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "E-mail ou usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Confirme sua senha"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const recoverySchema = z.object({
  email: z.string().email("E-mail inválido"),
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

  const onRecovery = async (data: RecoveryForm) => {
    // TODO: Implement password recovery
    console.log("Recovery for:", data.email);
    setRecoveryOpen(false);
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sistema de Agendamento</h1>
            <p className="text-gray-600">Gerencie suas reservas de salas</p>
          </div>

          <Card>
            <CardContent className="p-0">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="register">Cadastrar</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="p-6">
                  <CardHeader className="p-0 mb-6">
                    <CardTitle>Fazer Login</CardTitle>
                    <CardDescription>
                      Entre com suas credenciais para acessar o sistema
                    </CardDescription>
                  </CardHeader>

                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail ou Usuário</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Digite seu e-mail ou usuário" 
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
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Digite sua senha" 
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
                              Esqueci minha senha
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5 text-warning" />
                                Recuperar Senha
                              </DialogTitle>
                              <DialogDescription>
                                Digite seu e-mail para receber as instruções de recuperação
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...recoveryForm}>
                              <form onSubmit={recoveryForm.handleSubmit(onRecovery)} className="space-y-4">
                                <FormField
                                  control={recoveryForm.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>E-mail</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="email"
                                          placeholder="Digite seu e-mail" 
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
                                  <Button type="submit" className="flex-1 bg-warning hover:bg-yellow-600">
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
                        Entrar
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="register" className="p-6">
                  <CardHeader className="p-0 mb-6">
                    <CardTitle>Criar Conta</CardTitle>
                    <CardDescription>
                      Preencha os dados para se cadastrar no sistema
                    </CardDescription>
                  </CardHeader>

                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Digite seu nome completo" 
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
                            <FormLabel>Função (Cargo) *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ex: Gerente de Vendas" 
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
                            <FormLabel>E-mail *</FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder="Digite seu e-mail" 
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
                            <FormLabel>Nome de Usuário *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Digite um nome de usuário" 
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
                            <FormLabel>Senha *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Digite uma senha forte" 
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
                              Mínimo 8 caracteres com letras e números
                            </p>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Senha *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="Digite a senha novamente" 
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
                        Criar Conta
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-secondary items-center justify-center p-8">
        <div className="text-center text-white max-w-md">
          <div className="mb-8">
            <Calendar className="h-24 w-24 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl font-bold mb-4">Bem-vindo ao Sistema de Agendamento</h2>
            <p className="text-lg opacity-90 mb-6">
              Organize suas reuniões de forma eficiente e profissional
            </p>
          </div>
          
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Reserve salas de reunião facilmente</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Visualize disponibilidade em tempo real</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Gerencie seus agendamentos</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Acesso administrativo para gestores</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
