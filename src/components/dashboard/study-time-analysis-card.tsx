import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const teamMembers = [
  { name: 'Elena García', role: 'Jefa de Proyecto', avatar: 'https://placehold.co/40x40.png', hint: 'woman portrait' },
  { name: 'Miguel Torres', role: 'Arquitecto Principal', avatar: 'https://placehold.co/40x40.png', hint: 'man portrait' },
  { name: 'Sofía Romero', role: 'Administración', avatar: 'https://placehold.co/40x40.png', hint: 'person glasses' },
];

export function TeamList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipo de Administración</CardTitle>
        <CardDescription>Personal clave en la gestión de WinnBuilders.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {teamMembers.map(member => (
          <div key={member.name} className="flex items-center gap-4 p-2 rounded-lg hover:bg-secondary">
            <Avatar>
              <AvatarImage src={member.avatar} alt={member.name} data-ai-hint={member.hint} />
              <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{member.name}</p>
              <p className="text-sm text-muted-foreground">{member.role}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
