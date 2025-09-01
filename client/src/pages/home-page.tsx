import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { insertBookingSchema, insertRoomSchema, type Room, type BookingWithDetails, type User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  Clock, 
  DoorOpen, 
  Plus, 
  Users, 
  ChartPie, 
  CalendarDays,
  Settings,
  Edit,
  Trash2,
  AlertCircle,
  LogOut,
  User as UserIcon,
  Key
} from "lucide-react";

const bookingFormSchema = insertBookingSchema.extend({
  date: z.string().min(1, "Data é obrigatória"),
  startTime: z.string().min(1, "Horário de início é obrigatório"),
  endTime: z.string().min(1, "Horário de término é obrigatório"),
});

const roomFormSchema = insertRoomSchema;
const editRoomFormSchema = insertRoomSchema.pick({
  name: true,
  location: true,
  capacity: true,
});

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type BookingForm = z.infer<typeof bookingFormSchema>;
type RoomForm = z.infer<typeof roomFormSchema>;
type EditRoomForm = z.infer<typeof editRoomFormSchema>;
type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

interface DashboardStats {
  todayBookings: number;
  activeRooms: number;
  occupancyRate: number;
  activeUsers: number;
}

interface RoomStats {
  roomId: string;
  roomName: string;
  bookingCount: number;
  location: string;
}

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeScreen, setActiveScreen] = useState("dashboard");
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [newRoomOpen, setNewRoomOpen] = useState(false);
  const [editRoomOpen, setEditRoomOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAllBookings, setShowAllBookings] = useState(false);

  // Queries - Admin only
  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: Boolean(user?.isAdmin),
  });

  const { data: roomStats, isLoading: roomStatsLoading } = useQuery<RoomStats[]>({
    queryKey: ["/api/dashboard/room-stats"],
    enabled: Boolean(user?.isAdmin),
  });

  const { data: rooms, isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  // Get all bookings for dashboard, user bookings for "Meus Agendamentos"
  const { data: allBookings, isLoading: allBookingsLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings/all"],
  });

  const { data: userBookings, isLoading: userBookingsLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: allUsers, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: Boolean(user?.isAdmin),
  });

  // Mutations
  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingForm) => {
      try {
        const res = await apiRequest("POST", "/api/bookings", data);
        return await res.json();
      } catch (error: any) {
        // Handle specific HTTP status codes
        if (error.message.includes('409:')) {
          throw new Error('Esta sala já está reservada para este horário. Por favor, escolha outro horário ou sala.');
        } else if (error.message.includes('400:')) {
          throw new Error('Dados do agendamento inválidos. Verifique se o horário de término é posterior ao de início.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/all"] });
      if (user?.isAdmin) {
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/room-stats"] });
      }
      
      // Clear the form fields
      bookingForm.reset({
        title: "",
        description: "",
        responsavel: "",
        date: "",
        startTime: "",
        endTime: "",
        roomId: "",
      });
      
      setNewBookingOpen(false);
      toast({
        title: "Agendamento criado",
        description: "Sua reserva foi criada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar agendamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createRoomMutation = useMutation({
    mutationFn: async (data: RoomForm) => {
      const res = await apiRequest("POST", "/api/rooms", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/room-stats"] });
      
      // Clear the form fields
      roomForm.reset({
        name: "",
        location: "",
        capacity: 1,
      });
      
      setNewRoomOpen(false);
      toast({
        title: "Sala criada",
        description: "Nova sala foi cadastrada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar sala",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/bookings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Agendamento cancelado",
        description: "Reserva foi cancelada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cancelar agendamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/rooms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/room-stats"] });
      toast({
        title: "Sala removida",
        description: "Sala foi removida com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover sala",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EditRoomForm }) => {
      const res = await apiRequest("PATCH", `/api/rooms/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/room-stats"] });
      setEditRoomOpen(false);
      setEditingRoom(null);
      toast({
        title: "Sala atualizada",
        description: "As informações da sala foram atualizadas com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar sala",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserAdminMutation = useMutation({
    mutationFn: async ({ id, isAdmin }: { id: string; isAdmin: boolean }) => {
      await apiRequest("PATCH", `/api/users/${id}/admin`, { isAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Permissões atualizadas",
        description: "As permissões do usuário foram atualizadas com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar permissões",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { userId: string; newPassword: string }) => {
      const res = await apiRequest("PUT", `/api/users/${data.userId}/password`, { password: data.newPassword });
      return await res.json();
    },
    onSuccess: () => {
      changePasswordForm.reset();
      setChangePasswordOpen(false);
      toast({
        title: "Senha alterada",
        description: "A senha do usuário foi alterada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Forms
  const bookingForm = useForm<BookingForm>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      title: "",
      description: "",
      responsavel: "",
      date: "",
      startTime: "",
      endTime: "",
      roomId: "",
    },
  });

  const roomForm = useForm<RoomForm>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: "",
      location: "",
      capacity: 1,
    },
  });

  const editRoomForm = useForm<EditRoomForm>({
    resolver: zodResolver(editRoomFormSchema),
    defaultValues: {
      name: "",
      location: "",
      capacity: 1,
    },
  });

  const changePasswordForm = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    }
  });

  const onCreateBooking = async (data: BookingForm) => {
    await createBookingMutation.mutateAsync(data);
  };

  const onCreateRoom = async (data: RoomForm) => {
    await createRoomMutation.mutateAsync(data);
  };

  const onEditRoom = async (data: EditRoomForm) => {
    if (!editingRoom) return;
    await updateRoomMutation.mutateAsync({ id: editingRoom.id, data });
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    editRoomForm.reset({
      name: room.name,
      location: room.location,
      capacity: room.capacity,
    });
    setEditRoomOpen(true);
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };

  const handleChangePassword = (userItem: User) => {
    setSelectedUser(userItem);
    changePasswordForm.reset();
    setChangePasswordOpen(true);
  };

  const onChangePassword = async (data: ChangePasswordForm) => {
    if (!selectedUser) return;
    await changePasswordMutation.mutateAsync({ 
      userId: selectedUser.id, 
      newPassword: data.newPassword 
    });
  };

  // Helper function to format date without timezone issues
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Get future bookings in chronological order for dashboard
  const dashboardBookings = allBookings?.filter(booking => {
    const bookingDateTime = new Date(`${booking.date}T${booking.endTime}:00`);
    const now = new Date();
    return bookingDateTime > now;
  }).sort((a, b) => {
    // Sort by date first, then by start time
    const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateComparison !== 0) return dateComparison;
    return a.startTime.localeCompare(b.startTime);
  }) || [];

  // Use appropriate bookings based on screen
  const displayBookings = activeScreen === "bookings" ? userBookings : dashboardBookings;
  const bookingsLoading = activeScreen === "bookings" ? userBookingsLoading : allBookingsLoading;

  // Get top and least used rooms
  const topRooms = roomStats?.slice(0, 3) || [];
  const leastUsedRooms = roomStats?.slice(-3).reverse() || [];

  // Generate available time slots (7:00 AM to 6:00 PM, every 30 minutes)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 7; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Don't include 18:30 as it's past closing time
        if (hour === 18 && minute === 30) break;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  // Check if a time slot conflicts with existing bookings
  const isTimeSlotAvailable = (date: string, roomId: string, timeSlot: string, excludeBookingId?: string) => {
    if (!allBookings || !date || !roomId) return true;

    const dayBookings = allBookings.filter((booking: BookingWithDetails) => 
      booking.date === date && 
      booking.roomId === roomId && 
      booking.status === 'confirmed' &&
      booking.id !== excludeBookingId
    );

    const slotTime = new Date(`${date}T${timeSlot}:00`);

    return !dayBookings.some((booking: BookingWithDetails) => {
      const startTime = new Date(`${booking.date}T${booking.startTime}:00`);
      const endTime = new Date(`${booking.date}T${booking.endTime}:00`);
      // Check if the slot time falls within any existing booking
      return slotTime >= startTime && slotTime < endTime;
    });
  };

  // Get available start time slots for a specific date and room
  const getAvailableStartTimes = (date: string, roomId: string) => {
    if (!date || !roomId) return [];
    
    const allSlots = generateTimeSlots();
    return allSlots.filter(slot => isTimeSlotAvailable(date, roomId, slot));
  };

  // Get available end times based on start time
  const getAvailableEndTimes = (date: string, roomId: string, startTime: string) => {
    if (!date || !roomId || !startTime) return [];

    const allSlots = generateTimeSlots();
    const startIndex = allSlots.indexOf(startTime);
    
    if (startIndex === -1) return [];

    // Get all possible end times (must be after start time)
    const possibleEndTimes = allSlots.slice(startIndex + 1);
    
    // Filter end times that don't conflict with existing bookings
    const availableEndTimes = [];
    
    for (const endTime of possibleEndTimes) {
      // Check if the entire time range from startTime to endTime is available
      const startSlotIndex = allSlots.indexOf(startTime);
      const endSlotIndex = allSlots.indexOf(endTime);
      
      let isRangeAvailable = true;
      
      // Check each 30-minute slot in the range
      for (let i = startSlotIndex; i < endSlotIndex; i++) {
        if (!isTimeSlotAvailable(date, roomId, allSlots[i])) {
          isRangeAvailable = false;
          break;
        }
      }
      
      if (isRangeAvailable) {
        availableEndTimes.push(endTime);
      } else {
        // Stop at first conflict to ensure continuous availability
        break;
      }
    }
    
    return availableEndTimes;
  };

  // Watch form values for dynamic updates
  const watchedDate = bookingForm.watch("date");
  const watchedRoomId = bookingForm.watch("roomId");
  const watchedStartTime = bookingForm.watch("startTime");

  const availableStartTimes = getAvailableStartTimes(watchedDate, watchedRoomId);
  const availableEndTimes = getAvailableEndTimes(watchedDate, watchedRoomId, watchedStartTime);

  // Reset end time when date, room, or start time changes
  React.useEffect(() => {
    if (watchedDate || watchedRoomId || watchedStartTime) {
      const currentEndTime = bookingForm.getValues("endTime");
      if (currentEndTime && !availableEndTimes.includes(currentEndTime)) {
        bookingForm.setValue("endTime", "");
      }
    }
  }, [watchedDate, watchedRoomId, watchedStartTime, availableEndTimes, bookingForm]);

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Calendar className="text-white h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Agendamento</h2>
              <p className="text-xs text-gray-500">Sistema de Salas</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <Button
            variant={activeScreen === "dashboard" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveScreen("dashboard")}
          >
            <ChartPie className="mr-3 h-4 w-4" />
            Dashboard
          </Button>

          <Dialog open={newBookingOpen} onOpenChange={setNewBookingOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <Plus className="mr-3 h-4 w-4" />
                Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Novo Agendamento</DialogTitle>
                <DialogDescription>
                  Preencha os dados para reservar uma sala
                </DialogDescription>
              </DialogHeader>
              <Form {...bookingForm}>
                <form onSubmit={bookingForm.handleSubmit(onCreateBooking)} className="space-y-4">
                  <FormField
                    control={bookingForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título da Reunião *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Reunião de Planejamento Mensal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={bookingForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={bookingForm.control}
                      name="roomId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sala *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma sala" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {rooms?.map((room) => (
                                <SelectItem key={room.id} value={room.id}>
                                  {room.name} ({room.capacity} pessoas)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={bookingForm.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário de Início *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o horário" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableStartTimes.length === 0 ? (
                                <SelectItem value="none" disabled>
                                  {watchedDate && watchedRoomId ? "Nenhum horário disponível" : "Selecione primeiro a data e sala"}
                                </SelectItem>
                              ) : (
                                availableStartTimes.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={bookingForm.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário de Término *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o horário" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableEndTimes.length === 0 ? (
                                <SelectItem value="none" disabled>
                                  {watchedStartTime ? "Nenhum horário disponível" : "Selecione primeiro o horário de início"}
                                </SelectItem>
                              ) : (
                                availableEndTimes.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={bookingForm.control}
                    name="responsavel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsável pela Reunião</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: João Silva ou deixe vazio se você for o responsável"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={bookingForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva o objetivo da reunião..."
                            className="resize-none"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 mb-1">Verificação de Disponibilidade</h4>
                        <p className="text-sm text-blue-700">O sistema verificará automaticamente se a sala está disponível.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setNewBookingOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={createBookingMutation.isPending}
                    >
                      Criar Agendamento
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Button
            variant={activeScreen === "bookings" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveScreen("bookings")}
          >
            <CalendarDays className="mr-3 h-4 w-4" />
            Meus Agendamentos
          </Button>

          {user.isAdmin && (
            <>
              <Button
                variant={activeScreen === "rooms" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveScreen("rooms")}
              >
                <Settings className="mr-3 h-4 w-4" />
                Gerenciar Salas
              </Button>
              <Button
                variant={activeScreen === "users" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveScreen("users")}
              >
                <Users className="mr-3 h-4 w-4" />
                Gerenciar Usuários
              </Button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <Users className="text-gray-600 h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-900">{user.fullName}</p>
              <p className="text-xs text-gray-500">{user.position}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-700"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeScreen === "dashboard" && (
          <div className="flex-1 overflow-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Visão geral dos agendamentos</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Hoje</p>
                <p className="font-semibold text-gray-900">
                  {new Date().toLocaleDateString('pt-BR', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {/* Statistics Cards - Admin Only */}
            {user.isAdmin && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Agendamentos Hoje</p>
                        {statsLoading ? (
                          <Skeleton className="h-8 w-16" />
                        ) : (
                          <p className="text-2xl font-bold text-gray-900">{dashboardStats?.todayBookings || 0}</p>
                        )}
                      </div>
                      <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                        <CalendarDays className="text-primary h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Salas Ativas</p>
                        {statsLoading ? (
                          <Skeleton className="h-8 w-16" />
                        ) : (
                          <p className="text-2xl font-bold text-gray-900">{dashboardStats?.activeRooms || 0}</p>
                        )}
                      </div>
                      <div className="w-12 h-12 bg-success bg-opacity-10 rounded-full flex items-center justify-center">
                        <DoorOpen className="text-success h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Taxa de Ocupação</p>
                        {statsLoading ? (
                          <Skeleton className="h-8 w-16" />
                        ) : (
                          <p className="text-2xl font-bold text-gray-900">{dashboardStats?.occupancyRate || 0}%</p>
                        )}
                      </div>
                      <div className="w-12 h-12 bg-warning bg-opacity-10 rounded-full flex items-center justify-center">
                        <ChartPie className="text-warning h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Usuários Ativos</p>
                        {statsLoading ? (
                          <Skeleton className="h-8 w-16" />
                        ) : (
                          <p className="text-2xl font-bold text-gray-900">{dashboardStats?.activeUsers || 0}</p>
                        )}
                      </div>
                      <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-full flex items-center justify-center">
                        <Users className="text-secondary h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Room Usage Statistics - Admin Only */}
            {user.isAdmin && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Salas Mais Reservadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {roomStatsLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {topRooms.map((room, index) => (
                          <div key={room.roomId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                index === 0 ? 'bg-primary' : index === 1 ? 'bg-secondary' : 'bg-success'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{room.roomName}</p>
                                <p className="text-sm text-gray-500">{room.location}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">{room.bookingCount}</p>
                              <p className="text-sm text-gray-500">agendamentos</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Salas Menos Utilizadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {roomStatsLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {leastUsedRooms.map((room) => (
                          <div key={room.roomId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-error rounded-full flex items-center justify-center">
                                <AlertCircle className="text-white h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{room.roomName}</p>
                                <p className="text-sm text-gray-500">{room.location}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-error">{room.bookingCount}</p>
                              <p className="text-sm text-gray-500">agendamentos</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}



            {/* Upcoming Bookings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Próximos Agendamentos</CardTitle>
                  <Button onClick={() => setNewBookingOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Agendamento
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : dashboardBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum agendamento futuro encontrado</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sala</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsável</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dashboardBookings.map((booking: BookingWithDetails) => (
                          <tr key={booking.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-primary rounded-full mr-3"></div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{booking.title}</p>
                                  {booking.description && (
                                    <p className="text-xs text-gray-500">{booking.description}</p>
                                  )}
                                  {booking.responsavel && (
                                    <p className="text-xs text-blue-600">Responsável: {booking.responsavel}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>
                                <p>{formatDate(booking.date)}</p>
                                <p className="text-xs text-gray-500">{booking.startTime} - {booking.endTime}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.room.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.user.fullName}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                                {booking.status === "confirmed" ? "Confirmado" : "Pendente"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeScreen === "bookings" && (
          <div className="flex-1 overflow-auto p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {user?.isAdmin && showAllBookings ? "Todos os Agendamentos" : "Meus Agendamentos"}
                  </h1>
                  <p className="text-gray-600">
                    {user?.isAdmin && showAllBookings ? "Visualize todos os agendamentos do sistema" : "Gerencie seus agendamentos de salas"}
                  </p>
                </div>
                {user?.isAdmin && (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={showAllBookings}
                      onCheckedChange={setShowAllBookings}
                      id="show-all-bookings"
                    />
                    <label htmlFor="show-all-bookings" className="text-sm text-gray-600">
                      Ver todos
                    </label>
                  </div>
                )}
              </div>
            </div>

            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList>
                <TabsTrigger value="upcoming">Próximos</TabsTrigger>
                <TabsTrigger value="all">Todos</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4">
                {bookingsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : !displayBookings || displayBookings.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum agendamento encontrado</p>
                      <Button onClick={() => setNewBookingOpen(true)} className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Criar Agendamento
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  displayBookings.map((booking: BookingWithDetails) => (
                    <Card key={booking.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{booking.title}</h3>
                            {booking.description && (
                              <p className="text-gray-600 mb-3">{booking.description}</p>
                            )}
                            {booking.responsavel && (
                              <p className="text-gray-600 mb-3">
                                <span className="font-medium">Responsável:</span> {booking.responsavel}
                              </p>
                            )}
                            
                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(booking.date)}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span>{booking.startTime} - {booking.endTime}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <DoorOpen className="h-4 w-4" />
                                <span>{booking.room.name}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3 ml-4">
                            <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                              {booking.status === "confirmed" ? "Confirmado" : "Pendente"}
                            </Badge>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteBookingMutation.mutate(booking.id)}
                                disabled={deleteBookingMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="all" className="space-y-4">
                {bookingsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : !displayBookings || displayBookings.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum agendamento encontrado</p>
                      <Button onClick={() => setNewBookingOpen(true)} className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Criar Agendamento
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  displayBookings.map((booking: BookingWithDetails) => (
                    <Card key={booking.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{booking.title}</h3>
                            {booking.description && (
                              <p className="text-gray-600 mb-3">{booking.description}</p>
                            )}
                            {booking.responsavel && (
                              <p className="text-gray-600 mb-3">
                                <span className="font-medium">Responsável:</span> {booking.responsavel}
                              </p>
                            )}
                            
                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(booking.date)}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span>{booking.startTime} - {booking.endTime}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <DoorOpen className="h-4 w-4" />
                                <span>{booking.room.name}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3 ml-4">
                            <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                              {booking.status === "confirmed" ? "Confirmado" : "Pendente"}
                            </Badge>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteBookingMutation.mutate(booking.id)}
                                disabled={deleteBookingMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {activeScreen === "users" && user?.isAdmin && (
          <div className="flex-1 overflow-auto p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
                  <p className="text-gray-600">Controle as permissões de administrador dos usuários</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {usersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : allUsers?.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum usuário encontrado</p>
                  </CardContent>
                </Card>
              ) : (
                allUsers?.map((userItem) => (
                  <Card key={userItem.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{userItem.fullName}</h3>
                            <p className="text-sm text-gray-500">{userItem.email}</p>
                            <p className="text-xs text-gray-400">{userItem.position}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChangePassword(userItem)}
                            disabled={changePasswordMutation.isPending}
                            data-testid={`button-change-password-${userItem.id}`}
                          >
                            <Key className="h-4 w-4 mr-2" />
                            Trocar Senha
                          </Button>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Administrador</span>
                            <Switch
                              checked={userItem.isAdmin}
                              onCheckedChange={(checked) => 
                                updateUserAdminMutation.mutate({ 
                                  id: userItem.id, 
                                  isAdmin: checked 
                                })
                              }
                              disabled={updateUserAdminMutation.isPending || userItem.id === user.id}
                            />
                          </div>
                          {userItem.isAdmin && (
                            <Badge variant="default">Admin</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeScreen === "rooms" && user.isAdmin && (
          <div className="flex-1 overflow-auto p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gerenciar Salas</h1>
                  <p className="text-gray-600">Cadastre e gerencie as salas de reunião</p>
                </div>
                <Dialog open={newRoomOpen} onOpenChange={setNewRoomOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Nova Sala
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <DoorOpen className="h-5 w-5 text-primary" />
                        Nova Sala
                      </DialogTitle>
                      <DialogDescription>
                        Cadastre uma nova sala de reunião
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...roomForm}>
                      <form onSubmit={roomForm.handleSubmit(onCreateRoom)} className="space-y-4">
                        <FormField
                          control={roomForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome da Sala *</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Sala Executive Premium" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={roomForm.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Localização *</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: 3º Andar - Ala Oeste" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={roomForm.control}
                          name="capacity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Capacidade Máxima *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  max="500"
                                  placeholder="Ex: 15" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
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
                            onClick={() => setNewRoomOpen(false)}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            type="submit" 
                            className="flex-1"
                            disabled={createRoomMutation.isPending}
                          >
                            Criar Sala
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roomsLoading ? (
                [...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))
              ) : rooms?.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="text-center py-8">
                    <DoorOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma sala cadastrada</p>
                    <Button onClick={() => setNewRoomOpen(true)} className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeira Sala
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                rooms?.map((room) => {
                  const roomBookings = roomStats?.find(stat => stat.roomId === room.id)?.bookingCount || 0;
                  const occupancyRate = Math.min(Math.round((roomBookings / 30) * 100), 100); // Simplified calculation
                  
                  return (
                    <Card key={room.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{room.name}</h3>
                            <p className="text-sm text-gray-500 mb-2">{room.location}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>{room.capacity} pessoas</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{roomBookings} agendamentos</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditRoom(room)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteRoomMutation.mutate(room.id)}
                              disabled={deleteRoomMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Taxa de ocupação</span>
                            <span className="text-sm font-medium text-gray-900">{occupancyRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                occupancyRate >= 80 ? 'bg-primary' : 
                                occupancyRate >= 50 ? 'bg-secondary' :
                                occupancyRate >= 25 ? 'bg-warning' : 'bg-error'
                              }`}
                              style={{ width: `${occupancyRate}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Status</span>
                            <Badge variant={room.isActive ? "default" : "secondary"}>
                              {room.isActive ? "Ativa" : "Inativa"}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Room Dialog */}
      <Dialog open={editRoomOpen} onOpenChange={setEditRoomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Editar Sala
            </DialogTitle>
            <DialogDescription>
              Atualize as informações da sala
            </DialogDescription>
          </DialogHeader>
          <Form {...editRoomForm}>
            <form onSubmit={editRoomForm.handleSubmit(onEditRoom)} className="space-y-4">
              <FormField
                control={editRoomForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Sala *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Sala Executive Premium" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editRoomForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localização *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 3º Andar - Ala Oeste" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editRoomForm.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade Máxima *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="500"
                        placeholder="Ex: 20"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
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
                  onClick={() => {
                    setEditRoomOpen(false);
                    setEditingRoom(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={updateRoomMutation.isPending}
                >
                  Atualizar Sala
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Trocar Senha do Usuário
            </DialogTitle>
            <DialogDescription>
              {selectedUser && `Alterando a senha para: ${selectedUser.fullName} (${selectedUser.email})`}
            </DialogDescription>
          </DialogHeader>
          <Form {...changePasswordForm}>
            <form onSubmit={changePasswordForm.handleSubmit(onChangePassword)} className="space-y-4">
              <FormField
                control={changePasswordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha *</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Digite a nova senha" 
                        {...field}
                        data-testid="input-new-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={changePasswordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nova Senha *</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Digite novamente a nova senha" 
                        {...field}
                        data-testid="input-confirm-password"
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
                  onClick={() => {
                    setChangePasswordOpen(false);
                    setSelectedUser(null);
                    changePasswordForm.reset();
                  }}
                  data-testid="button-cancel-password"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={changePasswordMutation.isPending}
                  data-testid="button-confirm-password"
                >
                  {changePasswordMutation.isPending ? "Alterando..." : "Alterar Senha"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
