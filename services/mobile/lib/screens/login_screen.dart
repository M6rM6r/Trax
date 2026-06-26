import "package:flutter/material.dart";
import "package:provider/provider.dart";
import "../providers/auth_provider.dart";

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Icon(Icons.location_on, size: 64, color: Color(0xFF3C7EE7)),
                const SizedBox(height: 16),
                Text(
                  "Trax",
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF3C7EE7),
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  "تسجيل دخول الموظف",
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                const SizedBox(height: 32),
                TextFormField(
                  controller: _emailController,
                  decoration: const InputDecoration(
                    labelText: "البريد الإلكتروني",
                    prefixIcon: Icon(Icons.email),
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) => v!.isEmpty ? "Required" : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: "كلمة المرور",
                    prefixIcon: Icon(Icons.lock),
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) => v!.length < 6 ? "Min 6 chars" : null,
                ),
                const SizedBox(height: 24),
                if (auth.error != null)
                  Text(auth.error!, style: const TextStyle(color: Colors.red), textAlign: TextAlign.center),
                const SizedBox(height: 8),
                FilledButton(
                  onPressed: auth.isLoading
                      ? null
                      : () async {
                          if (_formKey.currentState!.validate()) {
                            final success = await auth.login(
                              _emailController.text,
                              _passwordController.text,
                            );
                            if (success && context.mounted) {
                              Navigator.pushReplacementNamed(context, "/home");
                            }
                          }
                        },
                  child: auth.isLoading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white))
                      : const Text("تسجيل الدخول"),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
