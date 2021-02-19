import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Home.module.css";
import { Button, Container, Header } from "semantic-ui-react";

export default function Home() {
  return (
    <div className="">
      <Head>
        <title>Invoice App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="">
        <Container className={styles.container}>
          <Header as="h1">Test Header</Header>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi ut ultrices justo. Etiam
            dapibus tincidunt diam, quis ultricies nisi auctor et. Proin vulputate lorem vitae felis
            dapibus gravida. Sed blandit, ex sed pharetra consectetur, urna nibh pulvinar urna, at
            hendrerit justo purus vel elit. Sed rutrum interdum velit, sit amet iaculis urna mollis
            quis. Donec elementum neque sit amet arcu malesuada commodo. Duis nisl nisi, ultricies
            in laoreet vitae, fringilla ut ligula. Fusce tempor sagittis euismod. Quisque tincidunt
            dolor ipsum, quis dignissim augue laoreet sed. Suspendisse sollicitudin consequat
            aliquam. Nullam efficitur dapibus metus. Duis dolor mauris, blandit at metus sit amet,
            hendrerit ullamcorper ipsum. Sed auctor id lacus id ultricies. Nullam lacinia laoreet
            nibh, sed imperdiet odio congue sed. Vivamus ultricies dolor ut iaculis volutpat. Cras
            non felis at odio venenatis vulputate quis eu odio. Curabitur non elementum nisi. Orci
            varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Mauris
            pharetra vehicula orci, vitae convallis elit mollis sit amet. In vel dignissim lacus.
            Donec congue lacus vitae accumsan condimentum. Quisque facilisis consequat aliquet.
            Vivamus lobortis massa orci, vitae mollis eros ullamcorper sit amet. Duis semper, velit
            quis luctus aliquam, enim purus pretium lorem, in dapibus ex mi eget lacus. Ut vel orci
            sed urna rhoncus dictum. Cras aliquet lacinia rutrum. Quisque elementum ac libero
            iaculis elementum. Mauris in molestie ligula. In gravida luctus tellus, quis euismod
            risus auctor eu. Aenean orci justo, finibus eget tempus nec, sodales vel dolor. Donec
            dictum euismod massa. Donec mollis aliquet consequat. Integer laoreet suscipit leo et
            fermentum. Suspendisse tristique ipsum vitae tortor tincidunt semper. Aenean mollis eu
            arcu eget tempor. Donec pellentesque neque tempus ultrices venenatis. In blandit
            venenatis maximus. Aliquam ut gravida augue. Maecenas in magna mi. Vestibulum aliquam
            pharetra urna sit amet venenatis. Etiam mattis eu libero eget pharetra. In pharetra
            tempus risus ac lacinia. In augue lacus, vehicula id augue vitae, ultricies sagittis
            mauris. Nullam quis iaculis dui, a dictum massa. Morbi hendrerit a erat vitae laoreet.
            Cras sagittis facilisis lectus, ullamcorper ornare odio faucibus at. Proin euismod
            tortor ullamcorper condimentum suscipit. Sed sit amet pulvinar est. Donec sollicitudin
            quam sit amet dui sollicitudin sollicitudin. Fusce quis enim ac sem commodo laoreet.
            Nulla scelerisque non nulla et tincidunt. Morbi purus urna, volutpat ac ullamcorper nec,
            elementum eu libero. Nulla ultricies dignissim nibh, at accumsan metus consectetur ut.
            Sed quis mi maximus, congue tortor sit amet, aliquam felis. Proin rutrum, nunc nec
            faucibus pulvinar, nunc augue vulputate est, non sollicitudin velit dolor rutrum dui.
            Curabitur eget est enim.
          </p>
          <Link href="/dashboard">
            <Button primary>Test Btn</Button>
          </Link>
        </Container>
      </main>

      <footer className=""></footer>
    </div>
  );
}
