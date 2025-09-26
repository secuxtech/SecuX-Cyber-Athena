import spec from "@/lib/api/swagger";
import ReactSwagger from "./react-swagger";

export default async function IndexPage() {
  return (
    <section className="container">
      <ReactSwagger spec={spec} />
    </section>
  );
}
