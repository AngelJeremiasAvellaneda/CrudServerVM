# Documentación: CRUD Web con SQL Server en Windows Server 2022 VM

## Índice
1. [Resumen del proyecto](#resumen)
2. [Arquitectura final](#arquitectura)
3. [¿Por qué Windows Server 2022?](#por-que-windows-server)
4. [¿Por qué no usar base de datos local o en la nube?](#por-que-no-local)
5. [Herramientas utilizadas](#herramientas)
6. [Proceso de configuración paso a paso](#proceso)
7. [Problemas encontrados y soluciones](#problemas)
8. [Códigos SQL utilizados](#sql)
9. [Pruebas realizadas](#pruebas)
10. [Conclusiones](#conclusiones)

---

## 1. Resumen del proyecto

Se construyó un sistema CRUD (Create, Read, Update, Delete) web completo donde:

- El **frontend** está desplegado en **Vercel** (accesible desde cualquier lugar del mundo)
- El **backend** (API REST con Express.js) corre dentro de una **máquina virtual** con **Windows Server 2022**
- La **base de datos** vive en **SQL Server 2022** instalado dentro de esa misma VM
- La comunicación entre Vercel e internet hacia la VM local se hace mediante un **túnel ngrok**

Cualquier usuario en el mundo puede entrar a la página web, y los datos que ve, agrega, edita o elimina están físicamente almacenados en el servidor SQL Server dentro de la máquina virtual.

---

## 2. Arquitectura final

```
┌─────────────────────────────────────────────────┐
│              INTERNET                           │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │         VERCEL (frontend)                │  │
│  │  Next.js 14 — página web + API Routes    │  │
│  │  Accesible desde cualquier navegador     │  │
│  └──────────────────┬───────────────────────┘  │
│                     │ HTTPS                     │
│  ┌──────────────────▼───────────────────────┐  │
│  │         NGROK (túnel)                    │  │
│  │  Puente entre internet y la VM local     │  │
│  │  URL: https://xxxx.ngrok-free.dev        │  │
│  └──────────────────┬───────────────────────┘  │
└─────────────────────┼───────────────────────────┘
                      │ túnel seguro
┌─────────────────────▼───────────────────────────┐
│         PC LOCAL (VMware Workstation)           │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │   VM: Windows Server 2022 Standard       │  │
│  │   IP NAT: 192.168.188.134               │  │
│  │                                          │  │
│  │  ┌────────────────────────────────────┐  │  │
│  │  │  Express.js (Node.js) puerto 3000  │  │  │
│  │  │  API REST: /api/productos          │  │  │
│  │  │           /api/status             │  │  │
│  │  └─────────────┬──────────────────────┘  │  │
│  │                │ localhost:1433           │  │
│  │  ┌─────────────▼──────────────────────┐  │  │
│  │  │  SQL Server 2022 Developer         │  │  │
│  │  │  Base de datos: MiAppDB            │  │  │
│  │  │  Tabla: Productos                  │  │  │
│  │  └────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 3. ¿Por qué Windows Server 2022?

### Diferencia entre Windows 10/11 y Windows Server

| Característica | Windows 10/11 | Windows Server 2022 |
|---|---|---|
| Propósito | Uso personal, escritorio | Servir recursos a otros equipos |
| Al iniciar abre | Escritorio normal | Administrador del Servidor |
| Conexiones simultáneas | Limitadas (licencia) | Sin límite |
| Servicios de red | Básicos | IIS, AD, DNS, DHCP completos |
| SQL Server | Funciona pero no recomendado | Entorno nativo y optimizado |
| Estabilidad 24/7 | No diseñado para eso | Diseñado para correr sin parar |

### Señales visuales de que es un servidor
- Al encender, aparece automáticamente el **Administrador del Servidor**
- Tiene herramientas como **Windows Admin Center** integradas
- Puede gestionar otros servidores desde su panel
- El sistema operativo está optimizado para correr servicios, no aplicaciones de usuario

### ¿Por qué usarlo en clase?
Simula exactamente lo que pasa en empresas reales: un servidor físico o virtual dedicado a alojar bases de datos, al que los sistemas externos se conectan para leer y escribir datos.

---

## 4. ¿Por qué no usar base de datos local o en la nube?

### ¿Por qué no base de datos local (en la misma PC)?

```
Si la base de datos estuviera en tu PC local:
  Vercel (internet) → ??? → localhost:1433 en tu PC
                        ↑
              No hay camino, localhost
              no es accesible desde internet
```

- `localhost` solo es accesible desde la misma máquina
- No hay forma directa de que Vercel llegue a tu PC
- Requerirías configuración compleja del router (port forwarding) con IP pública fija

### ¿Por qué no base de datos en la nube (Azure SQL, PlanetScale, etc.)?

| Aspecto | Nube | VM propia |
|---|---|---|
| Costo | Desde $5/mes, puede subir | Solo electricidad e internet |
| Control | Limitado, es del proveedor | Total, tú decides todo |
| Privacidad | Datos en servidores ajenos | Datos nunca salen de tu máquina |
| Aprendizaje | Abstraído, no ves el servidor | Aprendes redes, SO, configuración |
| Disponibilidad | 99.9% garantizado | Depende de que la VM esté encendida |
| Configuración | Click y listo | Requiere configurar todo a mano |

**El objetivo de este proyecto es aprender** cómo funciona un servidor real de base de datos, cómo se configura, cómo se asegura y cómo se conecta. La nube oculta todo eso.

---

## 5. Herramientas utilizadas

| Herramienta | Versión | Propósito |
|---|---|---|
| VMware Workstation | Player/Pro | Crear y correr la máquina virtual |
| Windows Server 2022 | Standard (Desktop Experience) | Sistema operativo del servidor |
| SQL Server 2022 | Developer Edition | Motor de base de datos |
| SSMS | 19.x | Interfaz gráfica para administrar SQL Server |
| SQL Server Configuration Manager | Incluido con SQL Server | Habilitar protocolos de red |
| Node.js | LTS 20.x | Entorno de ejecución para el backend |
| Express.js | 4.x | Framework para la API REST |
| mssql | 11.x | Driver para conectar Node.js a SQL Server |
| ngrok | 3.x | Túnel para exponer la VM a internet |
| Next.js | 14.x | Framework frontend (desplegado en Vercel) |
| React | 18.x | Librería de UI |
| lucide-react | latest | Iconos SVG para la interfaz |
| TypeScript | 5.x | Tipado estático |
| Vercel | - | Plataforma de despliegue del frontend |

---

## 6. Proceso de configuración paso a paso

### Paso 1: Crear la VM en VMware
- Tipo: Custom (Advanced)
- ISO: Windows Server 2022 Standard
- RAM: 4 GB, CPU: 2 cores, Disco: 60 GB
- Red: **NAT** (se intentó Bridged pero el adaptador WiFi no era compatible)

### Paso 2: Instalar Windows Server 2022
- Edición: Standard con Desktop Experience (interfaz gráfica)
- Contraseña de Administrador configurada
- Al iniciar se abre automáticamente el Administrador del Servidor

### Paso 3: Instalar SQL Server 2022
- Descargado desde microsoft.com (edición Developer, gratuita)
- Instalación Basic
- Se instaló también SSMS para administración

### Paso 4: Conectar SSMS al servidor local
- Server: `localhost`
- Authentication: Windows Authentication
- Se marcó "Certificado de servidor de confianza"

### Paso 5: Crear base de datos, tabla y usuario
- Se ejecutaron scripts SQL en SSMS (ver sección SQL)

### Paso 6: Habilitar TCP/IP en SQL Server
- SQL Server Configuration Manager
- Protocols for MSSQLSERVER → TCP/IP → Enable
- IPAll → TCP Port = 1433
- Reinicio del servicio SQL Server

### Paso 7: Habilitar modo de autenticación mixta
- Primer intento: vía SSMS (Propiedades del servidor → Seguridad) — no funcionó correctamente
- Solución: via registro de Windows con PowerShell

```powershell
Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQLServer" -Name "LoginMode" -Value 2
Restart-Service -Name "MSSQLSERVER" -Force
```

### Paso 8: Abrir firewall de Windows
```powershell
New-NetFirewallRule -DisplayName "SQL Server 1433" -Direction Inbound -Protocol TCP -LocalPort 1433 -Action Allow
```

### Paso 9: Instalar Node.js en la VM
- Descargado desde nodejs.org (versión LTS)
- Instalación estándar
- Se cerró y reabrió PowerShell para que tomara el PATH

### Paso 10: Crear el servidor Express
```powershell
mkdir C:\servidor
cd C:\servidor
npm init -y
npm install express mssql cors
notepad index.js
```

### Paso 11: Correr el servidor
```powershell
node index.js
# Salida: Servidor Express corriendo en http://localhost:3000
```

### Paso 12: Configurar ngrok
- Se intentó ngrok con túnel TCP (puerto 1433) → **falló**, requiere tarjeta de crédito en cuentas gratuitas
- Se intentó Playit.gg → TCP también es premium
- **Solución**: usar ngrok con túnel **HTTP** (puerto 3000) que sí es gratuito
- El backend Express actúa como intermediario entre HTTP y SQL Server

```powershell
.\ngrok.exe config add-authtoken TU_TOKEN
.\ngrok.exe http 3000
# Resultado: https://energize-display-pavement.ngrok-free.dev -> localhost:3000
```

### Paso 13: Actualizar Vercel
- Variable de entorno `API_URL` configurada con la URL de ngrok
- Las API Routes de Next.js hacen fetch al servidor Express en la VM
- Redeploy en Vercel

---

## 7. Problemas encontrados y soluciones

### Problema 1: VM en NAT, no accesible desde el host
**Síntoma:** `ping 192.168.188.134` → 100% perdidos  
**Causa:** VMware NAT aísla la VM de la red local  
**Intento:** Cambiar a Bridged  
**Resultado:** La VM obtuvo IP `169.254.x.x` (autoconfiguración) porque el WiFi no soporta Bridged correctamente  
**Solución final:** Continuar con NAT y usar ngrok (que funciona perfectamente con NAT porque la VM abre la conexión saliente)

### Problema 2: ngrok TCP requiere tarjeta de crédito
**Síntoma:** `ERROR: You must add a credit or debit card before you can use TCP endpoints`  
**Causa:** ngrok cambió su política, TCP ahora requiere verificación  
**Solución:** Usar ngrok HTTP en el puerto 3000 con un servidor Express como intermediario

### Problema 3: SQL Server en modo solo Windows Authentication
**Síntoma:** `{"error": "Error de inicio de sesión del usuario 'appuser'."}`  
**Causa:** SQL Server instalado por defecto solo acepta autenticación de Windows  
**Intento 1:** Cambiar via SSMS (Propiedades → Seguridad) → no se guardó el cambio  
**Solución:** Editar directamente el registro de Windows con PowerShell

### Problema 4: npm no reconocido después de instalar Node.js
**Síntoma:** `npm: el término no se reconoce`  
**Causa:** El PATH de la sesión de PowerShell no se actualiza automáticamente  
**Solución:** Cerrar y reabrir PowerShell como Administrador

---

## 8. Códigos SQL utilizados

### Crear base de datos
```sql
CREATE DATABASE MiAppDB;
GO
```

### Crear tabla de productos
```sql
USE MiAppDB;
GO

CREATE TABLE Productos (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    Nombre        NVARCHAR(100)  NOT NULL,
    Descripcion   NVARCHAR(255),
    Precio        DECIMAL(10,2)  NOT NULL,
    Stock         INT            NOT NULL,
    FechaCreacion DATETIME       DEFAULT GETDATE()
);
GO
```

### Crear usuario para conexión remota
```sql
CREATE LOGIN appuser WITH PASSWORD = 'AppPass123!';
USE MiAppDB;
CREATE USER appuser FOR LOGIN appuser;
ALTER ROLE db_datareader ADD MEMBER appuser;
ALTER ROLE db_datawriter ADD MEMBER appuser;
GO
```

### Insertar datos de prueba
```sql
INSERT INTO Productos (Nombre, Descripcion, Precio, Stock)
VALUES
('Laptop Dell',       'Laptop 15 pulgadas i7',  999.99, 10),
('Mouse Logitech',    'Mouse inalámbrico',        25.50, 50),
('Teclado Mecánico',  'Switch azul RGB',          75.00, 30);
GO
```

### Verificar que el login existe
```sql
SELECT name, type_desc FROM sys.server_principals WHERE name = 'appuser';
```

### Verificar modo de autenticación
```sql
-- Devuelve 1 = solo Windows, 0 = modo mixto (lo que necesitamos)
SELECT SERVERPROPERTY('IsIntegratedSecurityOnly') AS SoloWindows;
```

### Habilitar y restablecer contraseña del usuario
```sql
ALTER LOGIN appuser ENABLE;
ALTER LOGIN appuser WITH PASSWORD = 'AppPass123!';
GO
```

### Verificar que la tabla tiene datos
```sql
SELECT * FROM Productos;
```

### Consulta de health check (usada por la API)
```sql
SELECT 1 AS ok;
```

---

## 9. Pruebas realizadas

### Prueba 1: Conectividad de red de la VM
```cmd
# Desde PC host
ping 192.168.188.134
# Resultado: 100% perdidos (NAT bloquea)
# Conclusión: Se confirma que NAT no permite acceso directo → usar ngrok
```

### Prueba 2: SQL Server en modo mixto
```sql
SELECT SERVERPROPERTY('IsIntegratedSecurityOnly');
-- Primer resultado: 1 (fallido, solo Windows)
-- Después de fix por registro: 0 (exitoso, modo mixto)
```

### Prueba 3: Endpoint de la API desde el navegador
```
GET https://energize-display-pavement.ngrok-free.dev/api/productos
Respuesta esperada: Array JSON con productos
Resultado: [{"Id":1,"Nombre":"Laptop Dell",...}, ...]  ✅
```

### Prueba 4: Health check de conexión
```
GET https://energize-display-pavement.ngrok-free.dev/api/status
Respuesta: {
  "connected": true,
  "message": "Conectado a SQL Server",
  "database": "MiAppDB",
  "server": "Windows Server 2022 VM"
}  ✅
```

### Prueba 5: CRUD completo desde la página web
| Operación | Resultado |
|---|---|
| Listar productos | Se muestran los 3 registros de prueba ✅ |
| Agregar producto | Se crea y aparece en la tabla ✅ |
| Editar producto | Se actualizan los datos correctamente ✅ |
| Eliminar producto | Se elimina y desaparece de la tabla ✅ |

---

## 10. Conclusiones

### Lo que se logró
- Una VM con Windows Server 2022 funciona como servidor real de base de datos
- SQL Server 2022 aloja los datos de manera persistente en la VM
- Un servidor Express en la VM actúa como backend/API REST
- ngrok crea un túnel HTTP seguro para exponer el backend a internet
- Vercel sirve el frontend y se comunica con la VM a través del túnel
- Cualquier usuario en el mundo puede usar el CRUD y los datos viven en la VM

### ¿Qué hace que esto sea un "servidor"?
La VM con Windows Server 2022 cumple la definición de servidor porque:
1. Recibe peticiones de otros equipos (Vercel → ngrok → Express en la VM)
2. Procesa esas peticiones consultando SQL Server
3. Devuelve respuestas con los datos solicitados
4. Opera independientemente, sin que un humano lo esté usando

### Limitaciones de esta implementación
- **Disponibilidad:** El servidor solo está activo cuando la VM está encendida y ngrok está corriendo
- **URL de ngrok:** Con cuenta gratuita cambia cada vez que se reinicia ngrok
- **Escalabilidad:** Un solo servidor no puede manejar miles de usuarios simultáneos
- **Seguridad:** Para producción real se necesitaría HTTPS en el Express, autenticación de la API, etc.

### ¿Cómo se haría en producción real?
En un entorno empresarial real:
- El servidor sería hardware físico dedicado (no una VM en una laptop)
- Tendría una IP pública fija o un nombre de dominio permanente
- No se usaría ngrok sino port forwarding directo o un servicio de hosting
- SQL Server tendría backups automáticos, alta disponibilidad y cifrado
- La API tendría autenticación (JWT, API keys, etc.)
