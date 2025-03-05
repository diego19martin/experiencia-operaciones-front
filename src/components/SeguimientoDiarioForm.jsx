import { useState, useEffect } from 'react';
import { useAuth } from '@/context/authContext';
import { AlertCircle, CheckCircle } from 'lucide-react';
import DailyRecordService from '@/services/dailyRecordService';
import GoalService from '@/services/goalService';

const SeguimientoDiarioForm = () => {
  // Estados para formulario
  const [objetivos, setObjetivos] = useState([]);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [registros, setRegistros] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const { user } = useAuth(); // Para obtener el área del coordinador
  
  // Cargar objetivos correspondientes al área del coordinador
  useEffect(() => {
    const cargarObjetivos = async () => {
      try {
        setMensaje({ tipo: '', texto: '' });
        
        // Se asume que el usuario tiene un campo "area_id" en su objeto de usuario
        const datos = await GoalService.getByArea(user.area_id);
        setObjetivos(datos);
        
        // Verificar si ya hay registros para hoy
        await cargarRegistrosExistentes(datos);
      } catch (error) {
        console.error("Error al cargar objetivos:", error);
        setMensaje({
          tipo: 'error',
          texto: 'No se pudieron cargar los objetivos. Intente nuevamente.'
        });
      }
    };
    
    if (user?.area_id) {
      cargarObjetivos();
    }
  }, [user]);
  
  // Cargar registros existentes para la fecha seleccionada
  const cargarRegistrosExistentes = async (objetivosList) => {
    try {
      const registrosTemp = {};
      
      // Obtener registros para el área en la fecha seleccionada
      const registrosArea = await DailyRecordService.getByAreaAndDate(user.area_id, fecha);
      
      // Organizar registros por objetivo
      for (const registro of registrosArea) {
        registrosTemp[registro.goal_id] = {
          id: registro.id,
          valorAlcanzado: registro.value_achieved,
          comentario: registro.comment || ''
        };
      }
      
      setRegistros(registrosTemp);
    } catch (error) {
      console.error("Error al cargar registros existentes:", error);
    }
  };
  
  // Manejar cambio de fecha
  const handleFechaChange = async (nuevaFecha) => {
    setFecha(nuevaFecha);
    // Recargar registros para la nueva fecha
    await cargarRegistrosExistentes(objetivos);
  };
  
  // Manejar cambios en valores
  const handleValorChange = (objetivoId, valor) => {
    setRegistros({
      ...registros,
      [objetivoId]: {
        ...registros[objetivoId] || {},
        valorAlcanzado: valor
      }
    });
  };
  
  // Manejar cambios en comentarios
  const handleComentarioChange = (objetivoId, comentario) => {
    setRegistros({
      ...registros,
      [objetivoId]: {
        ...registros[objetivoId] || {},
        comentario
      }
    });
  };
  
  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });
    
    try {
      // Preparar promesas para guardar cada registro
      const promesas = objetivos.map(objetivo => {
        // Solo guardar objetivos que tienen valores
        if (!registros[objetivo.id]?.valorAlcanzado && registros[objetivo.id]?.valorAlcanzado !== 0) {
          return null;
        }
        
        return DailyRecordService.createOrUpdate({
          goal_id: objetivo.id,
          record_date: fecha,
          value_achieved: registros[objetivo.id].valorAlcanzado,
          comment: registros[objetivo.id].comentario || ''
        });
      }).filter(p => p !== null);
      
      // Enviar todas las promesas
      await Promise.all(promesas);
      
      setMensaje({
        tipo: 'exito',
        texto: 'Registros guardados correctamente'
      });
      
      // Recargar datos por si hay cambios
      await cargarRegistrosExistentes(objetivos);
    } catch (error) {
      console.error("Error al guardar registros:", error);
      setMensaje({
        tipo: 'error',
        texto: 'Error al guardar los registros. Intente nuevamente.'
      });
    } finally {
      setGuardando(false);
    }
  };
  
  // Calcular estado de cumplimiento para mostrar visualmente
  const calcularEstadoCumplimiento = (objetivo, valor) => {
    if (!valor && valor !== 0) return 'pendiente';
    
    if (objetivo.measurement_type === 'porcentaje' || objetivo.measurement_type === 'valor') {
      const targetValue = objetivo.measurement_type === 'porcentaje' 
        ? objetivo.target_percentage 
        : objetivo.target_value;
        
      if (valor >= targetValue) return 'cumplido';
      if (valor >= targetValue * 0.8) return 'parcial';
      return 'incumplido';
    }
    
    // Para tipo resolución (booleano)
    return valor ? 'cumplido' : 'incumplido';
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Carga de Seguimiento Diario</h1>
      
      {/* Selector de fecha */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium mb-2">Fecha de registro</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => handleFechaChange(e.target.value)}
          className="border rounded p-2"
          max={new Date().toISOString().split('T')[0]} // No permitir fechas futuras
        />
      </div>
      
      {/* Mensaje de estado */}
      {mensaje.texto && (
        <div className={`p-4 mb-4 rounded-lg flex items-center ${
          mensaje.tipo === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {mensaje.tipo === 'error' ? 
            <AlertCircle className="mr-2" size={20} /> : 
            <CheckCircle className="mr-2" size={20} />
          }
          {mensaje.texto}
        </div>
      )}
      
      {/* Lista de objetivos */}
      {objetivos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay objetivos asignados a su área.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {objetivos.map(objetivo => {
            const registro = registros[objetivo.id] || {};
            const estadoCumplimiento = calcularEstadoCumplimiento(
              objetivo, 
              registro.valorAlcanzado
            );
            
            return (
              <div 
                key={objetivo.id} 
                className={`mb-6 p-5 border rounded-lg shadow-sm ${
                  estadoCumplimiento === 'cumplido' ? 'border-l-4 border-l-green-500' :
                  estadoCumplimiento === 'parcial' ? 'border-l-4 border-l-yellow-500' :
                  estadoCumplimiento === 'incumplido' ? 'border-l-4 border-l-red-500' :
                  'border-l-4 border-l-gray-300'
                }`}
              >
                <h2 className="text-xl font-semibold">{objetivo.name}</h2>
                <p className="mb-3 text-gray-600">{objetivo.description}</p>
                
                <div className="mb-3">
                  <span className="font-medium">Meta: </span>
                  {objetivo.measurement_type === 'porcentaje' 
                    ? `${objetivo.target_percentage}%` 
                    : objetivo.measurement_type === 'resolucion'
                      ? 'Completado'
                      : objetivo.target_value
                  }
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Valor alcanzado
                  </label>
                  
                  {objetivo.measurement_type === 'porcentaje' ? (
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={registro.valorAlcanzado || ''}
                        className="border rounded p-2 w-24"
                        onChange={(e) => handleValorChange(objetivo.id, parseFloat(e.target.value))}
                      />
                      <span className="ml-2">%</span>
                    </div>
                  ) : objetivo.measurement_type === 'valor' ? (
                    <input
                      type="number"
                      step="0.01"
                      value={registro.valorAlcanzado || ''}
                      className="border rounded p-2 w-full"
                      onChange={(e) => handleValorChange(objetivo.id, parseFloat(e.target.value))}
                    />
                  ) : (
                    <select
                      value={registro.valorAlcanzado ? 'true' : 'false'}
                      className="border rounded p-2 w-full"
                      onChange={(e) => handleValorChange(
                        objetivo.id, 
                        e.target.value === 'true'
                      )}
                    >
                      <option value="">Seleccionar</option>
                      <option value="true">Completado</option>
                      <option value="false">No completado</option>
                    </select>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Comentario (opcional)
                  </label>
                  <textarea
                    value={registro.comentario || ''}
                    className="border rounded p-2 w-full"
                    onChange={(e) => handleComentarioChange(
                      objetivo.id, 
                      e.target.value
                    )}
                    placeholder="Añada un comentario o explicación"
                    rows={2}
                  />
                </div>
              </div>
            );
          })}
          
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={guardando}
              className={`px-5 py-2 rounded-lg font-medium text-white ${
                guardando 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {guardando ? 'Guardando...' : 'Guardar Registros'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SeguimientoDiarioForm;