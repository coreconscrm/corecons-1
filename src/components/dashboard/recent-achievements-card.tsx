import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const formSubmissions = [
  { id: 1, name: 'Pedro Jiménez', email: 'pedro.j@example.com', date: '2024-07-20', status: 'Contactado' },
  { id: 2, name: 'Laura Martín', email: 'laura.m@example.com', date: '2024-07-19', status: 'Pendiente' },
  { id: 3, name: 'Carlos Sánchez', email: 'carlos.s@example.com', date: '2024-07-18', status: 'Contactado' },
];

export function FormsResponses() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Respuestas de Formularios</CardTitle>
        <CardDescription>Nuevos prospectos desde el formulario de Google Forms.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formSubmissions.map(sub => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium">{sub.name}</TableCell>
                <TableCell>{sub.email}</TableCell>
                <TableCell>{sub.date}</TableCell>
                <TableCell>
                  <Badge variant={sub.status === 'Contactado' ? 'default' : 'outline'}>
                    {sub.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
