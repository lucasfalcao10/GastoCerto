import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { Icon, Pill, PrimaryButton, SectionTitle, SecondaryButton, Surface, palette } from "@/components/finance-ui";
import { useFinance } from "@/lib/finance-store";
import { startOAuthLogin } from "@/constants/oauth";

export default function ConnectScreen() {
  const { connection, lastSyncAt, newPurchases, syncDemo, importCsv, setConnection, user, backendConnected } = useFinance();
  const [status, setStatus] = useState("");
  const connected = connection === "connected";
  const sync = () => {
    syncDemo();
    setStatus("1 nova compra encontrada no cartão C6. Alimentação agora está em 27% do limite.");
  };
  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ["text/csv", "text/comma-separated-values", "application/octet-stream"], copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const text = await fetch(result.assets[0].uri).then((response) => response.text()).catch(() => "");
    const count = importCsv(text);
    setStatus(count ? `${count} lançamentos importados do seu extrato.` : "Não encontramos linhas compatíveis. Use CSV com data, descrição, valor e categoria.");
  };
  const connect = () => {
    setConnection("pending");
    setStatus("O fluxo Pluggy está preparado. Configure as credenciais seguras do projeto para abrir o consentimento C6.");
  };

  return (
    <ScreenContainer containerClassName="bg-[#0D1112]" safeAreaClassName="bg-[#0D1112]">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View>
          <Text style={styles.kicker}>DADOS AUTOMÁTICOS</Text>
          <Text style={styles.title}>Seu C6, sem digitação.</Text>
          <Text style={styles.subtitle}>Conecte por Open Finance e entenda cada compra no mesmo lugar.</Text>
        </View>

        <Surface style={styles.accountCard}>
          <Icon name={user ? "cloud-done-outline" : "person-circle-outline"} size={22} color={user ? palette.lime : palette.amber} />
          <View style={styles.accountCopy}>
            <Text style={styles.accountTitle}>{user ? `Dados sincronizados${backendConnected ? " na nuvem" : ""}` : "Entre para salvar na nuvem"}</Text>
            <Text style={styles.accountText}>{user ? (user.email || "Conta autenticada") : "Use sua conta Manus para acessar os mesmos lançamentos no navegador e no celular."}</Text>
          </View>
          {!user ? <SecondaryButton label="Entrar" onPress={() => startOAuthLogin().catch(() => setStatus("Não foi possível abrir o login agora."))} /> : <Pill tone={backendConnected ? "lime" : "muted"}>{backendConnected ? "Online" : "Local"}</Pill>}
        </Surface>

        <Surface style={styles.c6Card}>
          <View style={styles.c6Header}>
            <View style={styles.c6Logo}><Text style={styles.c6LogoText}>C6</Text></View>
            <View style={styles.c6Copy}><Text style={styles.c6Title}>C6 Bank</Text><Text style={styles.c6Sub}>Open Finance via Pluggy</Text></View>
            <Pill tone={connected ? "lime" : "amber"}>{connected ? "Conectado" : "Não conectado"}</Pill>
          </View>
          <View style={styles.divider} />
          <View style={styles.stepList}>
            <Step num="01" title="Consentimento seguro" text="Você autoriza o C6 dentro do fluxo oficial do Open Finance." done={connected} />
            <Step num="02" title="Transações automáticas" text="Compras no cartão chegam categorizadas no GastoCerto." done={connected} />
            <Step num="03" title="Alertas que ajudam" text="Você recebe um aviso quando uma categoria passa do limite." done={Boolean(newPurchases)} />
          </View>
          <PrimaryButton label="Conectar conta C6" icon="link" onPress={connect} />
        </Surface>

        {status ? (
          <Surface style={styles.status}>
            <Icon name={status.includes("nova") ? "notifications-outline" : "information-circle-outline"} size={20} color={status.includes("nova") ? palette.lime : palette.amber} />
            <Text style={styles.statusText}>{status}</Text>
          </Surface>
        ) : null}

        <View style={styles.syncLine}>
          <View>
            <Text style={styles.sectionSmall}>SINCRONIZAÇÃO</Text>
            <Text style={styles.syncText}>{lastSyncAt ? `Última tentativa ${new Date(lastSyncAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}` : "Ainda não sincronizado"}</Text>
          </View>
          <Pressable onPress={sync} style={styles.syncButton}><Icon name="sync-outline" size={18} color={palette.lime} /><Text style={styles.syncButtonText}>Sincronizar agora</Text></Pressable>
        </View>

        <SectionTitle eyebrow="sem conexão bancária?" title="Importe seu extrato" />
        <Surface>
          <View style={styles.importHeader}>
            <View style={styles.importIcon}><Icon name="document-text-outline" size={21} color={palette.blue} /></View>
            <View style={styles.importCopy}><Text style={styles.importTitle}>OFX ou CSV do app C6</Text><Text style={styles.importText}>Uma alternativa simples para começar agora. O arquivo fica no seu aparelho.</Text></View>
          </View>
          <SecondaryButton label="Importar arquivo" icon="cloud-upload-outline" onPress={pickFile} />
          <Text style={styles.formatHint}>CSV esperado: data, descrição, valor, categoria</Text>
        </Surface>

        <Surface style={styles.privacy}>
          <Icon name="shield-checkmark-outline" size={21} color={palette.lime} />
          <View style={styles.privacyCopy}><Text style={styles.privacyTitle}>Privacidade primeiro</Text><Text style={styles.privacyText}>Client ID e Client Secret da Pluggy ficam somente no servidor. O app nunca pede sua senha do C6 por aqui.</Text></View>
        </Surface>
        <Pressable onPress={() => Linking.openURL("https://docs.pluggy.ai/en/docs/open-finance/overview")}><Text style={styles.learn}>Saiba como o Open Finance funciona ↗</Text></Pressable>
        <View style={{ height: 20 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

function Step({ num, title, text, done }: { num: string; title: string; text: string; done?: boolean }) {
  return <View style={styles.stepRow}><View style={[styles.stepNum, done && styles.stepDone]}>{done ? <Icon name="checkmark" size={14} color={palette.bg} /> : <Text style={styles.stepNumText}>{num}</Text>}</View><View style={styles.stepCopy}><Text style={styles.stepTitle}>{title}</Text><Text style={styles.stepText}>{text}</Text></View></View>;
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 780, alignSelf: "center", padding: 18, gap: 18 }, accountCard: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: palette.surfaceAlt }, accountCopy: { flex: 1 }, accountTitle: { color: palette.text, fontSize: 13, fontWeight: "800" }, accountText: { color: palette.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  kicker: { color: palette.muted, fontWeight: "800", fontSize: 11, letterSpacing: 1.2, marginBottom: 7 },
  title: { color: palette.text, fontWeight: "900", fontSize: 28, letterSpacing: -0.8 },
  subtitle: { color: palette.muted, fontSize: 14, lineHeight: 20, marginTop: 8, maxWidth: 520 },
  c6Card: { padding: 17 }, c6Header: { flexDirection: "row", alignItems: "center", gap: 11 }, c6Logo: { width: 43, height: 43, borderRadius: 14, backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center" }, c6LogoText: { color: "#111", fontWeight: "900", fontSize: 13 }, c6Copy: { flex: 1 }, c6Title: { color: palette.text, fontSize: 16, fontWeight: "800" }, c6Sub: { color: palette.muted, fontSize: 12, marginTop: 3 }, divider: { height: 1, backgroundColor: palette.border, marginVertical: 17 }, stepList: { gap: 15, marginBottom: 18 }, stepRow: { flexDirection: "row", gap: 11, alignItems: "flex-start" }, stepNum: { width: 26, height: 26, borderRadius: 9, borderWidth: 1, borderColor: palette.border, alignItems: "center", justifyContent: "center" }, stepDone: { backgroundColor: palette.lime, borderColor: palette.lime }, stepNumText: { color: palette.muted, fontSize: 10, fontWeight: "800" }, stepCopy: { flex: 1 }, stepTitle: { color: palette.text, fontSize: 13, fontWeight: "800" }, stepText: { color: palette.muted, fontSize: 12, lineHeight: 18, marginTop: 2 }, status: { flexDirection: "row", gap: 10, backgroundColor: palette.limeSoft, borderColor: "#40532A" }, statusText: { color: "#D4E8AF", flex: 1, fontSize: 13, lineHeight: 19 }, syncLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, sectionSmall: { color: palette.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.1 }, syncText: { color: palette.text, fontSize: 13, fontWeight: "700", marginTop: 5 }, syncButton: { borderRadius: 13, backgroundColor: palette.surfaceAlt, borderWidth: 1, borderColor: palette.border, paddingHorizontal: 11, paddingVertical: 10, flexDirection: "row", gap: 7, alignItems: "center" }, syncButtonText: { color: palette.lime, fontSize: 12, fontWeight: "800" }, importHeader: { flexDirection: "row", gap: 11, marginBottom: 16 }, importIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: "#182B31", alignItems: "center", justifyContent: "center" }, importCopy: { flex: 1 }, importTitle: { color: palette.text, fontWeight: "800", fontSize: 14 }, importText: { color: palette.muted, lineHeight: 18, fontSize: 12, marginTop: 3 }, formatHint: { color: palette.muted, fontSize: 10, marginTop: 10 }, privacy: { flexDirection: "row", gap: 11, backgroundColor: palette.surfaceAlt }, privacyCopy: { flex: 1 }, privacyTitle: { color: palette.text, fontWeight: "800", fontSize: 13, marginBottom: 4 }, privacyText: { color: palette.muted, fontSize: 12, lineHeight: 18 }, learn: { color: palette.lime, textAlign: "center", fontSize: 12, fontWeight: "700", paddingVertical: 5 },
});
