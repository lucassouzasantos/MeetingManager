import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { KitchenOrderWithDetails } from "@shared/schema";
import { CheckCircle2, Clock, Users, Coffee, Utensils, Bell } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default function KitchenPanel() {
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'completed' | 'all'>('pending');

  const { data: orders, isLoading } = useQuery<KitchenOrderWithDetails[]>({
    queryKey: ["/api/kitchen/orders"],
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const completeOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("PATCH", `/api/kitchen/orders/${orderId}/complete`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kitchen/orders"] });
      toast({
        title: "Pedido completado",
        description: "El pedido ha sido marcado como atendido",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo completar el pedido",
        variant: "destructive",
      });
    },
  });

  const filteredOrders = orders?.filter(order => {
    if (selectedStatus === 'all') return true;
    return order.status === selectedStatus;
  }) || [];

  const pendingCount = orders?.filter(o => o.status === 'pending').length || 0;
  const completedCount = orders?.filter(o => o.status === 'completed').length || 0;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coffee className="h-8 w-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Panel de Cocina</h1>
        </div>
        
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 rounded-lg">
            <Bell className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">
              {pendingCount} pedido{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Pedidos Pendientes</p>
                <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="text-orange-600 h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Pedidos Completados</p>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-green-600 h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total de Pedidos</p>
                <p className="text-2xl font-bold text-gray-900">{orders?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Coffee className="text-gray-600 h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={selectedStatus === 'pending' ? 'default' : 'outline'}
          onClick={() => setSelectedStatus('pending')}
          className="flex items-center gap-2"
        >
          <Clock className="h-4 w-4" />
          Pendientes ({pendingCount})
        </Button>
        <Button
          variant={selectedStatus === 'completed' ? 'default' : 'outline'}
          onClick={() => setSelectedStatus('completed')}
          className="flex items-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          Completados ({completedCount})
        </Button>
        <Button
          variant={selectedStatus === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedStatus('all')}
          className="flex items-center gap-2"
        >
          Todos ({orders?.length || 0})
        </Button>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Coffee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedStatus === 'pending' ? 'No hay pedidos pendientes' : 
               selectedStatus === 'completed' ? 'No hay pedidos completados' : 
               'No hay pedidos registrados'}
            </h3>
            <p className="text-gray-500">
              {selectedStatus === 'pending' 
                ? 'Los nuevos pedidos aparecerán aquí cuando se solicite servicio de café en las reservas.'
                : 'Los pedidos aparecerán aquí una vez que sean procesados.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <Card key={order.id} className={`${order.status === 'pending' ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{order.booking.title}</CardTitle>
                  <Badge 
                    variant={order.status === 'pending' ? 'destructive' : 'default'}
                    className={order.status === 'pending' ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-green-100 text-green-800 border-green-200'}
                  >
                    {order.status === 'pending' ? 'Pendiente' : 'Completado'}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{order.room.name}</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Fecha y Hora</p>
                    <p className="text-gray-600">
                      {format(parseISO(order.orderDate), "dd 'de' MMMM", { locale: es })}
                    </p>
                    <p className="text-gray-600">{order.orderTime}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Solicitado por</p>
                    <p className="text-gray-600">{order.user.fullName}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Personas: {order.peopleCount}</span>
                  </div>
                  
                  {order.requestedMeals && (
                    <div className="flex items-start gap-2 text-sm">
                      <Utensils className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div>
                        <span className="font-medium">Comidas:</span>
                        <p className="text-gray-600 mt-1">{order.requestedMeals}</p>
                      </div>
                    </div>
                  )}
                  
                  {order.requestedDrinks && (
                    <div className="flex items-start gap-2 text-sm">
                      <Coffee className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div>
                        <span className="font-medium">Bebidas:</span>
                        <p className="text-gray-600 mt-1">{order.requestedDrinks}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {order.status === 'pending' && (
                  <Button
                    onClick={() => completeOrderMutation.mutate(order.id)}
                    disabled={completeOrderMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700 mt-4"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {completeOrderMutation.isPending ? 'Procesando...' : 'Marcar como Atendido'}
                  </Button>
                )}
                
                {order.status === 'completed' && order.completedAt && (
                  <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                    Completado el {format(parseISO(order.completedAt), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}