import "package:flutter/material.dart";
import "package:provider/provider.dart";
import "../providers/auth_provider.dart";

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    return Scaffold(
      appBar: AppBar(title: const Text("الملف الشخصي")),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const CircleAvatar(radius: 60, child: Icon(Icons.person, size: 60)),
            const SizedBox(height: 16),
            Text(auth.userName ?? "", style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(auth.userEmail ?? "", style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 32),
            const Card(
              child: ListTile(
                leading: Icon(Icons.badge),
                title: Text("المسمى الوظيفي"),
                subtitle: Text("موظف"),
              ),
            ),
            const Card(
              child: ListTile(
                leading: Icon(Icons.business),
                title: Text("القسم"),
                subtitle: Text("غير محدد"),
              ),
            ),
            const Spacer(),
            TextButton(
              onPressed: () async {
                await auth.logout();
                if (context.mounted) Navigator.pushReplacementNamed(context, "/login");
              },
              child: const Text("تسجيل الخروج", style: TextStyle(color: Colors.red)),
            ),
          ],
        ),
      ),
    );
  }
}
